const { createClient } = require("@supabase/supabase-js");
const src = require("fs").readFileSync(__dirname + "/check_db.js", "utf8");
const url = src.match(/const url = "([^"]+)"/)[1];
const key = src.match(/const key = "([^"]+)"/)[1];
const supabase = createClient(url, key);
(async () => {
  const { data, error } = await supabase.from("purchase_orders")
    .select("*, items:purchase_order_items(*), invoices:supplier_invoices(*, items:supplier_invoice_items(*), payments:supplier_payments(*)), advance_payments:supplier_payments(*)")
    .eq("po_number", "PO-RES-2026-0003");
  console.log(error, JSON.stringify(data, null, 1));
})();
