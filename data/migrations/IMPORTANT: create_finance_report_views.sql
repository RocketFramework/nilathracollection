-- Accounting finance report views (read-only).
-- Rule: PO LKR uses the PO/agreed rate (purchase_order_items.total_price_lkr);
--       invoice LKR uses the rate saved on the invoice (supplier_invoices.exchange_rate);
--       payment LKR uses the rate saved on each payment. No rate is guessed or mixed.
-- Driver POs: agreed LKR lives in tour_itinerary_drivers and is not included here (po_value_lkr stays NULL).
-- Each child table is aggregated to PO level BEFORE joining, so nothing is double-counted.

-- 1) One row per PO ---------------------------------------------------------------
DROP VIEW IF EXISTS public.v_finance_po_report;
CREATE VIEW public.v_finance_po_report AS
WITH po_items AS (
  SELECT
    i.purchase_order_id,
    COUNT(*)                                             AS item_count,
    COUNT(*) FILTER (WHERE i.total_price_lkr IS NULL)    AS items_without_lkr,
    SUM(i.total_price_lkr)                               AS agreed_lkr_sum
  FROM public.purchase_order_items i
  GROUP BY i.purchase_order_id
),
inv AS (
  SELECT
    s.purchase_order_id,
    COUNT(*)                                                                   AS invoice_count,
    STRING_AGG(s.invoice_number, ', ' ORDER BY s.invoice_date)                 AS invoice_numbers,
    STRING_AGG(DISTINCT s.currency, ', ')                                      AS invoice_currencies,
    STRING_AGG(DISTINCT CASE WHEN s.currency <> 'LKR' THEN s.exchange_rate::text END, ', ') AS invoice_rates,
    SUM(s.amount)                                                              AS invoiced_amount_own_ccy,
    SUM(s.amount * CASE WHEN s.currency = 'LKR' THEN 1 ELSE s.exchange_rate END) AS invoiced_lkr
  FROM public.supplier_invoices s
  GROUP BY s.purchase_order_id
),
pay AS (
  -- refunds are stored as negative amounts, so the sums are already net of refunds
  SELECT
    p.purchase_order_id,
    SUM(p.amount * CASE WHEN p.currency = 'LKR' THEN 1 ELSE p.exchange_rate END)                         AS paid_lkr_net,
    SUM(CASE WHEN p.is_refund THEN p.amount * CASE WHEN p.currency = 'LKR' THEN 1 ELSE p.exchange_rate END ELSE 0 END) AS refunded_lkr,
    MAX(p.payment_date)                                                                                  AS last_payment_date
  FROM (
    SELECT sp.*, COALESCE(sp.purchase_order_id, si.purchase_order_id) AS po_id
    FROM public.supplier_payments sp
    LEFT JOIN public.supplier_invoices si ON si.id = sp.supplier_invoice_id
  ) x
  CROSS JOIN LATERAL (SELECT x.po_id AS purchase_order_id, x.amount, x.currency, x.exchange_rate, x.is_refund, x.payment_date) p
  GROUP BY p.purchase_order_id
)
SELECT
  po.id                                   AS purchase_order_id,
  po.po_number,
  po.po_date,
  po.tour_id,
  t.tour_code,
  po.vendor_type,
  po.vendor_name,
  po.status                               AS po_status,
  po.settlement_mode,
  po.currency                             AS po_currency,
  po.total_amount                         AS po_value_own_ccy,
  -- PO value in LKR at the PO/agreed rate; NULL (not guessed) when any line has no agreed LKR
  CASE
    WHEN po.currency = 'LKR' THEN po.total_amount
    WHEN COALESCE(pi.item_count, 0) > 0 AND pi.items_without_lkr = 0 THEN pi.agreed_lkr_sum
  END                                     AS po_value_lkr,
  CASE
    WHEN po.currency = 'LKR' THEN 1
    WHEN COALESCE(pi.item_count, 0) > 0 AND pi.items_without_lkr = 0 AND po.total_amount <> 0
      THEN ROUND(pi.agreed_lkr_sum / po.total_amount, 4)
  END                                     AS po_rate_used,
  COALESCE(inv.invoice_count, 0)          AS invoice_count,
  inv.invoice_numbers,
  inv.invoice_currencies,
  inv.invoice_rates                       AS invoice_rates_used,
  inv.invoiced_amount_own_ccy,
  inv.invoiced_lkr,
  -- gap = invoiced LKR (invoice rate) minus PO LKR (PO rate); NULL when either side is missing
  CASE
    WHEN inv.invoiced_lkr IS NOT NULL
     AND (po.currency = 'LKR' OR (COALESCE(pi.item_count, 0) > 0 AND pi.items_without_lkr = 0))
    THEN inv.invoiced_lkr - CASE WHEN po.currency = 'LKR' THEN po.total_amount ELSE pi.agreed_lkr_sum END
  END                                     AS invoice_vs_po_gap_lkr,
  pay.paid_lkr_net,
  pay.refunded_lkr,
  pay.last_payment_date,
  inv.invoiced_lkr - COALESCE(pay.paid_lkr_net, 0) AS invoice_balance_lkr
FROM public.purchase_orders po
LEFT JOIN public.tours t ON t.id = po.tour_id
LEFT JOIN po_items pi ON pi.purchase_order_id = po.id
LEFT JOIN inv         ON inv.purchase_order_id = po.id
LEFT JOIN pay         ON pay.purchase_order_id = po.id;

-- 2) One row per invoice line vs PO line ------------------------------------------
CREATE OR REPLACE VIEW public.v_finance_po_line_report AS
SELECT
  po.po_number,
  po.vendor_name,
  po.currency                  AS po_currency,
  poi.id                       AS purchase_order_item_id,
  poi.description              AS po_description,
  poi.service_date,
  poi.quantity                 AS po_quantity,
  poi.unit_price               AS po_unit_price,
  poi.total_price              AS po_total_own_ccy,
  poi.total_price_lkr          AS po_total_lkr,
  poi.fx_rate                  AS po_rate_used,
  si.invoice_number,
  si.invoice_date,
  si.currency                  AS invoice_currency,
  si.exchange_rate             AS invoice_rate_used,
  sii.quantity                 AS inv_quantity,
  sii.unit_price               AS inv_unit_price,
  sii.total_price              AS inv_total_own_ccy,
  sii.total_price * CASE WHEN si.currency = 'LKR' THEN 1 ELSE si.exchange_rate END AS inv_total_lkr
FROM public.purchase_order_items poi
JOIN public.purchase_orders po          ON po.id = poi.purchase_order_id
LEFT JOIN public.supplier_invoice_items sii ON sii.purchase_order_item_id = poi.id
LEFT JOIN public.supplier_invoices si   ON si.id = sii.supplier_invoice_id;
