import { Settings } from '@/types/types';

const loadJsPDF = () => {
    return new Promise<any>((resolve) => {
        if (typeof window === 'undefined') {
            resolve(null);
            return;
        }
        if ((window as any).jspdf) {
            resolve((window as any).jspdf);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => resolve((window as any).jspdf);
        document.head.appendChild(script);
    });
};

const getBase64ImageFromUrl = async (url: string): Promise<string> => {
    const data = await fetch(url);
    const blob = await data.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
    });
};

const getImageDimensions = (base64: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = () => resolve({ width: 40, height: 16 });
        img.src = base64;
    });
};

const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Printable Payment Settlement Voucher for suppliers that are paid directly
 * (cash / transfer) against a signed acknowledgement instead of a formal invoice.
 * Shows the saved PO values only; nothing is recomputed.
 */
export const generateSettlementVoucherPdf = async (
    po: any,
    appSettings: any,
    agentName: string,
    touristData: any,
    usdLkrRate?: number,
    tourCode?: string | null
): Promise<any> => {
    const jspdfModule = await loadJsPDF();
    if (!jspdfModule) return null;
    const { jsPDF } = jspdfModule;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const primaryColor = [27, 58, 45];
    const secondaryColor = [201, 168, 76];
    const charcoalColor = [51, 51, 51];

    let topY = 20;
    let logoBottomY = 20;

    if (appSettings?.[Settings.Company_Logo]) {
        try {
            const logoBase64 = await getBase64ImageFromUrl(appSettings[Settings.Company_Logo]);
            const dims = await getImageDimensions(logoBase64);
            const aspectRatio = dims.width / dims.height;
            let logoWidth = 40;
            let logoHeight = logoWidth / aspectRatio;
            if (logoHeight > 16) { logoHeight = 16; logoWidth = logoHeight * aspectRatio; }
            doc.addImage(logoBase64, 'PNG', 20, topY, logoWidth, logoHeight);
            logoBottomY = topY + logoHeight;
        } catch (e) {
            console.error("Failed to add logo to settlement voucher:", e);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("NILATHRA COLLECTION", 20, topY + 10);
            logoBottomY = topY + 15;
        }
    } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("NILATHRA COLLECTION", 20, topY + 10);
        logoBottomY = topY + 15;
    }

    const voucherNo = `VCH-${po.po_number || String(po.id || '').slice(0, 8)}`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("PAYMENT SETTLEMENT VOUCHER", 108, 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.text(`Voucher No: ${voucherNo}`, 108, 34);
    doc.text(`PO Number: ${po.po_number || '-'}`, 108, 39);
    doc.text(`Issued: ${formatDate(new Date().toISOString())}`, 108, 44);

    const lineY = Math.max(logoBottomY + 6, 52);
    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, lineY, 190, lineY);
    topY = lineY + 8;

    const col1X = 20;
    const col2X = 110;

    // Payee
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("PAYEE (SUPPLIER):", col1X, topY);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.text(po.vendor_name || 'Supplier', col1X, topY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let payeeY = topY + 10;
    const vendorTypeLabel = ({ driver: 'Driver', vendor: 'Activity Provider', transport: 'Transport Provider', guide: 'Tour Guide', hotel: 'Hotel', restaurant: 'Restaurant' } as Record<string, string>)[po.vendor_type] || 'Supplier';
    doc.text(`Type: ${vendorTypeLabel}`, col1X, payeeY);
    payeeY += 4.5;
    if (po.settled_by_name) { doc.text(`Received By: ${po.settled_by_name}`, col1X, payeeY); payeeY += 4.5; }
    if (po.vendor_phone) { doc.text(`Phone: ${po.vendor_phone}`, col1X, payeeY); payeeY += 4.5; }
    if (po.vendor_address) {
        const addr = doc.splitTextToSize(po.vendor_address, 80);
        doc.text(addr, col1X, payeeY);
        payeeY += addr.length * 4.5;
    }

    // Issuer
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("PAID BY:", col2X, topY);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.text("Nilathra Collection", col2X, topY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let issuerY = topY + 10;
    if (appSettings?.[Settings.Address]) {
        const a = doc.splitTextToSize(appSettings[Settings.Address], 80);
        doc.text(a, col2X, issuerY);
        issuerY += a.length * 4.5;
    }
    doc.text(`Agent: ${agentName}`, col2X, issuerY);
    doc.text("Email: concierge@nilathra.com", col2X, issuerY + 4.5);
    issuerY += 9;

    topY = Math.max(payeeY, issuerY) + 6;

    // Tour details
    const guestName = `${touristData?.profile?.first_name || ''} ${touristData?.profile?.last_name || ''}`.trim();
    const adults = touristData?.preferences?.adults ?? 0;
    const children = touristData?.preferences?.children ?? 0;
    const infants = touristData?.preferences?.infants ?? 0;
    let paxStr = `${adults} Adults`;
    if (children > 0) paxStr += `, ${children} Children`;
    if (infants > 0) paxStr += `, ${infants} Infants`;

    doc.setFillColor(245, 243, 239);
    doc.rect(20, topY, 170, 21, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("TOUR DETAILS:", 24, topY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.text(`Guest: ${guestName || '-'}`, 24, topY + 11);
    doc.text(`Tour Dates: ${formatDate(touristData?.preferences?.arrival_date)} - ${formatDate(touristData?.preferences?.departure_date)}`, 24, topY + 16);
    doc.text(`Party: ${paxStr}`, 110, topY + 11);
    doc.text(`Tour ID: ${tourCode || '-'}`, 110, topY + 16);
    topY += 27;

    // Items
    const items: any[] = [...(po.items || [])].sort((a: any, b: any) => (a.day_number || 0) - (b.day_number || 0));
    // Driver and activity-provider vouchers are shown in LKR (USD PO values converted at the tour rate)
    const showInLkr = (po.vendor_type === 'driver' || po.vendor_type === 'vendor') && (po.currency || 'USD') === 'USD' && !!usdLkrRate && usdLkrRate > 0;
    const fx = showInLkr ? (usdLkrRate as number) : 1;
    const currency = showInLkr ? 'LKR' : (po.currency || 'USD');
    // Saved unit prices are rounded to 2dp, so qty x unit can differ by cents from the saved agreed subtotal.
    // Lines are scaled so they add up exactly to the saved subtotal (the agreed value stays the source of truth).
    const itemsSum = items.reduce((s: number, i: any) => s + Number(i.total_price ?? 0), 0);
    const savedSubtotal = Number(po.subtotal || 0);
    const lineScale = itemsSum > 0 && savedSubtotal > 0 ? savedSubtotal / itemsSum : 1;

    const drawItemsHeader = () => {
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(20, topY, 170, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(255, 255, 255);
        doc.text("Date / Day", 24, topY + 5);
        doc.text("Service Description", 60, topY + 5);
        doc.text("Qty", 138, topY + 5, { align: 'center' });
        doc.text("Unit", 160, topY + 5, { align: 'right' });
        doc.text("Total", 188, topY + 5, { align: 'right' });
        topY += 7;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    };
    drawItemsHeader();

    for (const item of items) {
        const dateLabel = item.service_date ? formatDate(item.service_date) : (item.day_number ? `Day ${item.day_number}` : '-');
        const desc = doc.splitTextToSize(item.description || 'Service', 72);
        const cellH = Math.max(8, desc.length * 4.5 + 2);
        if (topY + cellH > 235) {
            doc.addPage();
            topY = 20;
            drawItemsHeader();
        }
        doc.setFontSize(8.5);
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.2);
        doc.line(20, topY + cellH, 190, topY + cellH);
        doc.text(dateLabel, 24, topY + 5);
        doc.text(desc, 60, topY + 5);
        doc.text(String(item.quantity ?? 1), 138, topY + 5, { align: 'center' });
        const lineTotal = Number(item.total_price ?? 0) * lineScale * fx;
        const lineQty = Number(item.quantity ?? 1) || 1;
        doc.text((lineTotal / lineQty).toFixed(2), 160, topY + 5, { align: 'right' });
        doc.text(lineTotal.toFixed(2), 188, topY + 5, { align: 'right' });
        topY += cellH;
    }

    topY += 6;
    if (topY > 215) { doc.addPage(); topY = 20; }

    const discount = Number(po.discount || 0) * fx;
    const tax = Number(po.tax || 0) * fx;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    if (discount > 0 || tax > 0) {
        doc.text("Subtotal:", 118, topY);
        doc.text(`${currency} ${(Number(po.subtotal || 0) * fx).toFixed(2)}`, 188, topY, { align: 'right' });
        topY += 5.5;
        if (discount > 0) { doc.text("Discount:", 118, topY); doc.text(`-${currency} ${discount.toFixed(2)}`, 188, topY, { align: 'right' }); topY += 5.5; }
        if (tax > 0) { doc.text("Tax:", 118, topY); doc.text(`+${currency} ${tax.toFixed(2)}`, 188, topY, { align: 'right' }); topY += 5.5; }
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Agreed Total Payable:", 118, topY);
    doc.text(`${currency} ${(Number(po.total_amount || 0) * fx).toFixed(2)}`, 188, topY, { align: 'right' });
    topY += 10;

    // Payment mode tick boxes
    doc.setFontSize(9.5);
    doc.text("PAYMENT RECEIVED BY:", 20, topY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.3);
    doc.rect(70, topY - 3.5, 4, 4);
    doc.text("Cash", 76, topY);
    doc.rect(95, topY - 3.5, 4, 4);
    doc.text("Bank Transfer", 101, topY);
    doc.rect(135, topY - 3.5, 4, 4);
    doc.text("Other: ____________", 141, topY);
    topY += 9;

    doc.text("Amount actually received:  ________________________   Date: ____ / ____ / ________", 20, topY);
    topY += 10;

    // Acknowledgement text
    if (topY > 225) { doc.addPage(); topY = 20; }
    const ack = `I, the undersigned, confirm that the services listed above were agreed with Nilathra Collection at the total stated, that I have received the payment shown, and that no further amount is due for these services.`;
    const ackLines = doc.splitTextToSize(ack, 170);
    doc.setFontSize(8.5);
    doc.text(ackLines, 20, topY);
    topY += ackLines.length * 4.5 + 10;

    if (topY > 235) { doc.addPage(); topY = 20; }

    // Signature blocks
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.line(20, topY + 14, 90, topY + 14);
    doc.line(120, topY + 14, 190, topY + 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("RECEIVED BY (SUPPLIER)", 20, topY + 19);
    doc.text("PAID BY (NILATHRA COLLECTION)", 120, topY + 19);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.text(`Name: ${po.settled_by_name || '______________________'}`, 20, topY + 25);
    doc.text("NIC / ID No: ______________________", 20, topY + 30);
    doc.text("Date: ____ / ____ / ________", 20, topY + 35);
    doc.text(`Name: ${agentName || '______________________'}`, 120, topY + 25);
    doc.text("Designation: ______________________", 120, topY + 30);
    doc.text("Date: ____ / ____ / ________", 120, topY + 35);

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${totalPages}`, 105, 287, { align: 'center' });
        doc.text("Nilathra Collection - Luxury Unfiltered - Colombo, Sri Lanka", 20, 287);
        doc.text(voucherNo, 190, 287, { align: 'right' });
    }

    return doc;
};

/**
 * Printable voucher for a miscellaneous tour expense (no purchase order), to be signed by the
 * person who received the money. Shows the saved expense values only; nothing is recomputed
 * except the display-only LKR equivalent of a foreign-currency amount using the saved exchange rate.
 */
export const generateExpenseVoucherPdf = async (
    expense: any,
    appSettings: any,
    agentName: string,
    touristData: any,
    tourCode?: string | null
): Promise<any> => {
    const jspdfModule = await loadJsPDF();
    if (!jspdfModule) return null;
    const { jsPDF } = jspdfModule;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const primaryColor = [27, 58, 45];
    const secondaryColor = [201, 168, 76];
    const charcoalColor = [51, 51, 51];

    let topY = 20;
    let logoBottomY = 20;

    if (appSettings?.[Settings.Company_Logo]) {
        try {
            const logoBase64 = await getBase64ImageFromUrl(appSettings[Settings.Company_Logo]);
            const dims = await getImageDimensions(logoBase64);
            const aspectRatio = dims.width / dims.height;
            let logoWidth = 40;
            let logoHeight = logoWidth / aspectRatio;
            if (logoHeight > 16) { logoHeight = 16; logoWidth = logoHeight * aspectRatio; }
            doc.addImage(logoBase64, 'PNG', 20, topY, logoWidth, logoHeight);
            logoBottomY = topY + logoHeight;
        } catch (e) {
            console.error("Failed to add logo to expense voucher:", e);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("NILATHRA COLLECTION", 20, topY + 10);
            logoBottomY = topY + 15;
        }
    } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("NILATHRA COLLECTION", 20, topY + 10);
        logoBottomY = topY + 15;
    }

    const voucherNo = `EXP-${String(expense.id || '').slice(0, 8).toUpperCase() || 'DRAFT'}`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("EXPENSE PAYMENT VOUCHER", 108, 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.text(`Voucher No: ${voucherNo}`, 108, 34);
    doc.text(`Expense Date: ${formatDate(expense.expense_date)}`, 108, 39);
    doc.text(`Issued: ${formatDate(new Date().toISOString())}`, 108, 44);

    const lineY = Math.max(logoBottomY + 6, 52);
    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, lineY, 190, lineY);
    topY = lineY + 8;

    // Payee / Issuer
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("PAID TO:", 20, topY);
    doc.text("PAID BY:", 110, topY);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.text(expense.paid_to || '______________________', 20, topY + 5);
    doc.text("Nilathra Collection", 110, topY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let issuerY = topY + 10;
    if (appSettings?.[Settings.Address]) {
        const a = doc.splitTextToSize(appSettings[Settings.Address], 80);
        doc.text(a, 110, issuerY);
        issuerY += a.length * 4.5;
    }
    doc.text(`Agent: ${agentName}`, 110, issuerY);
    issuerY += 4.5;
    topY = Math.max(topY + 10, issuerY) + 6;

    // Tour details
    const guestName = `${touristData?.profile?.first_name || ''} ${touristData?.profile?.last_name || ''}`.trim();
    const adults = touristData?.preferences?.adults ?? 0;
    const children = touristData?.preferences?.children ?? 0;
    const infants = touristData?.preferences?.infants ?? 0;
    let paxStr = `${adults} Adults`;
    if (children > 0) paxStr += `, ${children} Children`;
    if (infants > 0) paxStr += `, ${infants} Infants`;

    doc.setFillColor(245, 243, 239);
    doc.rect(20, topY, 170, 21, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("TOUR DETAILS:", 24, topY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.text(`Guest: ${guestName || '-'}`, 24, topY + 11);
    doc.text(`Tour Dates: ${formatDate(touristData?.preferences?.arrival_date)} - ${formatDate(touristData?.preferences?.departure_date)}`, 24, topY + 16);
    doc.text(`Party: ${paxStr}`, 110, topY + 11);
    doc.text(`Tour ID: ${tourCode || '-'}`, 110, topY + 16);
    topY += 29;

    // Expense details
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(20, topY, 170, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text("EXPENSE DETAILS", 24, topY + 5);
    topY += 12;

    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.setFontSize(9);
    const detailRow = (label: string, value: string) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 24, topY);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(value || '-', 120);
        doc.text(lines, 66, topY);
        topY += Math.max(1, lines.length) * 4.5 + 2;
    };
    detailRow("Category:", expense.category);
    detailRow("Description:", expense.description);
    detailRow("Payment Method:", expense.payment_method || '-');
    detailRow("Reference:", expense.payment_reference || '-');
    if (expense.notes) detailRow("Notes:", expense.notes);

    topY += 2;
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.2);
    doc.line(20, topY, 190, topY);
    topY += 8;

    const currency = expense.currency || 'LKR';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Amount Paid:", 118, topY);
    doc.text(`${currency} ${Number(expense.amount || 0).toFixed(2)}`, 188, topY, { align: 'right' });
    if (currency !== 'LKR') {
        topY += 5.5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
        doc.text(`(approx. LKR ${(Number(expense.amount || 0) * Number(expense.exchange_rate || 1)).toFixed(2)})`, 188, topY, { align: 'right' });
    }
    topY += 12;

    // Payment mode tick boxes
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("PAYMENT RECEIVED BY:", 20, topY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.3);
    const method = String(expense.payment_method || '').toLowerCase();
    doc.rect(70, topY - 3.5, 4, 4);
    doc.text("Cash", 76, topY);
    doc.rect(95, topY - 3.5, 4, 4);
    doc.text("Bank Transfer", 101, topY);
    doc.rect(135, topY - 3.5, 4, 4);
    doc.text("Other: ____________", 141, topY);
    if (method.includes('cash')) doc.text("x", 71, topY - 0.3);
    else if (method.includes('transfer') || method.includes('bank')) doc.text("x", 96, topY - 0.3);
    topY += 12;

    const ack = `I, the undersigned, confirm that I have received the amount stated above from Nilathra Collection for the purpose described.`;
    const ackLines = doc.splitTextToSize(ack, 170);
    doc.setFontSize(8.5);
    doc.text(ackLines, 20, topY);
    topY += ackLines.length * 4.5 + 10;

    // Signature blocks
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.line(20, topY + 14, 90, topY + 14);
    doc.line(120, topY + 14, 190, topY + 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("RECEIVED BY", 20, topY + 19);
    doc.text("PAID BY (NILATHRA COLLECTION)", 120, topY + 19);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.text(`Name: ${expense.paid_to || '______________________'}`, 20, topY + 25);
    doc.text("NIC / ID No: ______________________", 20, topY + 30);
    doc.text("Date: ____ / ____ / ________", 20, topY + 35);
    doc.text(`Name: ${agentName || '______________________'}`, 120, topY + 25);
    doc.text("Designation: ______________________", 120, topY + 30);
    doc.text("Date: ____ / ____ / ________", 120, topY + 35);

    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.text("Nilathra Collection - Luxury Unfiltered - Colombo, Sri Lanka", 20, 287);
    doc.text(voucherNo, 190, 287, { align: 'right' });

    return doc;
};
