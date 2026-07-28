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
        script.onload = () => {
            resolve((window as any).jspdf);
        };
        document.head.appendChild(script);
    });
};

const getBase64ImageFromUrl = async (url: string): Promise<string> => {
    const data = await fetch(url);
    const blob = await data.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const base64data = reader.result as string;
            resolve(base64data);
        };
        reader.onerror = reject;
    });
};

const getImageDimensions = (base64: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => {
            resolve({ width: 40, height: 16 });
        };
        img.src = base64;
    });
};

export const generateCustomerPaymentReceiptPdf = async (
    payment: any,
    invoice: any,
    appSettings: any,
    touristData?: any,
    tour?: any
): Promise<any> => {
    const jspdfModule = await loadJsPDF();
    if (!jspdfModule) return null;
    const { jsPDF } = jspdfModule;

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const primaryColor = [27, 58, 45]; // #1B3A2D (Dark Emerald)
    const secondaryColor = [201, 168, 76]; // #C9A84C (Gold)
    const charcoalColor = [51, 51, 51]; // #333333
    const neutralBg = [245, 247, 245];

    let topY = 20;
    let logoBottomY = 20;

    // 1. Header & Logo
    const logoUrl = appSettings?.[Settings.Company_Logo] || appSettings?.company_logo || '/logo.png';
    try {
        const base64Logo = await getBase64ImageFromUrl(logoUrl);
        const dimensions = await getImageDimensions(base64Logo);
        const maxHeight = 16;
        const width = (dimensions.width * maxHeight) / dimensions.height;
        doc.addImage(base64Logo, 'PNG', 15, 15, width, maxHeight);
        logoBottomY = 15 + maxHeight + 5;
    } catch {
        doc.setFont('serif', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("NILATHRA COLLECTION", 15, 22);
        logoBottomY = 28;
    }

    // Company Info on Right Side Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    const companyName = appSettings?.company_name || 'NILATHRA COLLECTION';
    doc.text(companyName.toUpperCase(), 190, 18, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);

    const companyAddress = appSettings?.company_address || 'Colombo, Sri Lanka';
    const addressLines = doc.splitTextToSize(companyAddress, 70);
    doc.text(addressLines, 190, 23, { align: 'right' });
    const companyPhone = appSettings?.company_phone || '+94 77 123 4567';
    const companyEmail = appSettings?.company_email || 'info@nilathracollection.com';
    doc.text(`${companyPhone} | ${companyEmail}`, 190, 23 + (addressLines.length * 3.5), { align: 'right' });

    topY = Math.max(logoBottomY + 5, 40);

    // Decorative Gold Horizontal Rule
    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setLineWidth(0.8);
    doc.line(15, topY, 190, topY);
    topY += 10;

    // Document Title Banner: OFFICIAL PAYMENT RECEIPT
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(15, topY, 175, 12, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text("OFFICIAL PAYMENT RECEIPT", 20, topY + 8);

    const receiptNo = `REC-${new Date(payment.payment_date || payment.created_at || Date.now()).getFullYear()}-${String(payment.id || '').substring(0, 6).toUpperCase()}`;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Receipt #: ${receiptNo}`, 185, topY + 8, { align: 'right' });

    topY += 18;

    // Metadata Box (Customer details & Receipt Date)
    const billingName = invoice?.billing_details?.name 
        || (touristData?.profile ? `${touristData.profile.first_name || ''} ${touristData.profile.last_name || ''}`.trim() : '')
        || 'Valued Guest';
    const billingEmail = invoice?.billing_details?.email || touristData?.profile?.email || 'N/A';
    const billingPhone = invoice?.billing_details?.phone || touristData?.profile?.phone || 'N/A';
    const billingAddress = invoice?.billing_details?.address || touristData?.profile?.address || '';

    const pDate = payment.payment_date || (payment.created_at ? new Date(payment.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

    // Box 1: Received From (Left)
    doc.setFillColor(neutralBg[0], neutralBg[1], neutralBg[2]);
    doc.roundedRect(15, topY, 83, 34, 2, 2, 'F');
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(15, topY, 83, 34, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("RECEIVED FROM", 19, topY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.text(billingName, 19, topY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Email: ${billingEmail}`, 19, topY + 17);
    doc.text(`Phone: ${billingPhone}`, 19, topY + 21);
    if (billingAddress) {
        const addrShort = doc.splitTextToSize(billingAddress, 75)[0];
        doc.text(addrShort, 19, topY + 25);
    }

    // Box 2: Receipt & Tour Information (Right)
    doc.setFillColor(neutralBg[0], neutralBg[1], neutralBg[2]);
    doc.roundedRect(107, topY, 83, 34, 2, 2, 'F');
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(107, topY, 83, 34, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("RECEIPT DETAILS", 111, topY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);

    doc.text("Payment Date:", 111, topY + 12);
    doc.setFont('helvetica', 'bold');
    doc.text(pDate, 145, topY + 12);

    doc.setFont('helvetica', 'normal');
    doc.text("Invoice Ref:", 111, topY + 17);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice?.invoice_number || 'Advance / General Payment', 145, topY + 17);

    doc.setFont('helvetica', 'normal');
    doc.text("Payment Method:", 111, topY + 22);
    doc.setFont('helvetica', 'bold');
    doc.text(payment.payment_method || 'Bank Transfer', 145, topY + 22);

    doc.setFont('helvetica', 'normal');
    doc.text("Reference / Tx ID:", 111, topY + 27);
    doc.setFont('helvetica', 'bold');
    doc.text(payment.transaction_id || 'N/A', 145, topY + 27);

    topY += 40;

    // Payment Acknowledgement Summary Highlight Card
    const payAmt = Number(payment.amount) || 0;
    const payCurr = payment.currency || invoice?.currency || 'USD';
    const exRate = Number(payment.exchange_rate) || 1.0;
    const usdAmt = (!payment.currency || payment.currency === 'USD') ? payAmt : (exRate > 0 ? payAmt / exRate : payAmt);

    const cardHeight = payCurr !== 'USD' ? 26 : 22;

    doc.setFillColor(235, 245, 240); // Soft Light Emerald
    doc.roundedRect(15, topY, 175, cardHeight, 2, 2, 'F');
    doc.setDrawColor(27, 58, 45);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, topY, 175, cardHeight, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("AMOUNT RECEIVED:", 22, topY + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(27, 120, 55); // Green Paid Stamp text
    doc.text("[ PAYMENT CONFIRMED ]", 182, topY + 8, { align: 'right' });

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(27, 58, 45);
    doc.text(`${payCurr} ${payAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 22, topY + 15);

    if (payCurr !== 'USD') {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(`(USD Equivalent: $${usdAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} @ Rate ${exRate})`, 22, topY + 21);
    }

    topY += cardHeight + 6;

    // Account Summary Table (If Invoice present)
    if (invoice) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("STATEMENT OF ACCOUNT", 15, topY);
        topY += 4;

        const totalInvoiceAmount = Number(invoice.amount) || 0;
        const allPayments = invoice.payments || [];
        const totalPaidToDate = allPayments.reduce((sum: number, p: any) => {
            const amt = Number(p.amount) || 0;
            const rate = Number(p.exchange_rate) || 1.0;
            const usd = (!p.currency || p.currency === 'USD') ? amt : (rate > 0 ? amt / rate : amt);
            return sum + usd;
        }, 0);
        const balanceRemaining = Math.max(0, totalInvoiceAmount - totalPaidToDate);

        // Account Table Box
        doc.setFillColor(neutralBg[0], neutralBg[1], neutralBg[2]);
        doc.roundedRect(15, topY, 175, 28, 2, 2, 'F');
        doc.setDrawColor(220, 220, 220);
        doc.roundedRect(15, topY, 175, 28, 2, 2, 'D');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);

        doc.text("Total Invoice Amount:", 22, topY + 8);
        doc.setFont('helvetica', 'bold');
        doc.text(`${invoice.currency || 'USD'} ${totalInvoiceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 182, topY + 8, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.text("Total Payments Received to Date:", 22, topY + 15);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(27, 58, 45);
        doc.text(`${invoice.currency || 'USD'} ${totalPaidToDate.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 182, topY + 15, { align: 'right' });

        doc.setDrawColor(200, 200, 200);
        doc.line(22, topY + 18, 182, topY + 18);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(balanceRemaining <= 0 ? 27 : 180, balanceRemaining <= 0 ? 120 : 80, balanceRemaining <= 0 ? 45 : 20);
        doc.text("Remaining Balance Due:", 22, topY + 24);
        doc.text(`${invoice.currency || 'USD'} ${balanceRemaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 182, topY + 24, { align: 'right' });

        topY += 34;
    }

    // Notes & Terms
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("ACKNOWLEDGEMENT & TERMS:", 15, topY);
    topY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    const terms = [
        "This is an official payment receipt issued by Nilathra Collection acknowledging receipt of funds mentioned above.",
        "All payments are non-refundable except in accordance with Nilathra Collection's booking & cancellation terms.",
        "Thank you for choosing Nilathra Collection for your bespoke travel experience."
    ];
    terms.forEach(t => {
        doc.text(`• ${t}`, 15, topY);
        topY += 4;
    });

    // System-generated notice (no signature required)
    topY += 12;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("This is a system-generated document, a signature is not required.", 105, topY, { align: 'center' });

    // Footer
    const pageHeight = doc.internal.pageSize.height || 297;
    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(15, pageHeight - 15, 190, pageHeight - 15);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text("Nilathra Collection — Curated Luxury Travel Experiences", 105, pageHeight - 10, { align: 'center' });

    return doc;
};
