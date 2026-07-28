import { Settings } from '@/types/types';
import { DBCustomerInvoice } from '@/types/finance';

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

export const generateCustomerInvoicePdf = async (
    invoice: DBCustomerInvoice,
    appSettings: any,
    touristData?: any
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

    let topY = 20;
    let logoBottomY = 20;

    // Load Company Logo
    if (appSettings?.[Settings.Company_Logo]) {
        try {
            const logoBase64 = await getBase64ImageFromUrl(appSettings[Settings.Company_Logo]);
            const dims = await getImageDimensions(logoBase64);
            const aspectRatio = dims.width / dims.height;
            let logoWidth = 40;
            let logoHeight = logoWidth / aspectRatio;

            if (logoHeight > 16) {
                logoHeight = 16;
                logoWidth = logoHeight * aspectRatio;
            }

            doc.addImage(logoBase64, 'PNG', 20, topY, logoWidth, logoHeight);
            logoBottomY = topY + logoHeight;
        } catch (e) {
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

    // Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("CUSTOMER INVOICE", 115, 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);

    const formattedCreatedDate = new Date(invoice.created_at || Date.now()).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    const formattedDueDate = invoice.due_date
        ? new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'On Presentation';

    doc.text(`Invoice No: ${invoice.invoice_number || 'INV-DRAFT'}`, 115, 34);
    doc.text(`Invoice Date: ${formattedCreatedDate}`, 115, 39);
    doc.text(`Due Date: ${formattedDueDate}`, 115, 44);
    doc.text(`Status: ${(invoice.status || 'Pending').toUpperCase()}`, 115, 49);

    const lineY = Math.max(logoBottomY + 6, 54);
    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, lineY, 190, lineY);
    topY = lineY + 8;

    const col1X = 20;
    const col2X = 110;

    // BILLED TO (Guest Info)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("BILLED TO:", col1X, topY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.text(invoice.billing_details?.name || 'Valued Guest', col1X, topY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let guestY = topY + 10;
    if (invoice.billing_details?.email) {
        doc.text(`Email: ${invoice.billing_details.email}`, col1X, guestY);
        guestY += 4.5;
    }
    if (invoice.billing_details?.phone) {
        doc.text(`Phone: ${invoice.billing_details.phone}`, col1X, guestY);
        guestY += 4.5;
    }
    if (invoice.billing_details?.address) {
        const splitAddr = doc.splitTextToSize(invoice.billing_details.address, 80);
        doc.text(splitAddr, col1X, guestY);
        guestY += (splitAddr.length * 4.5);
    }
    if (touristData?.preferences?.travel_style) {
        doc.text(`Travel Style: ${touristData.preferences.travel_style}`, col1X, guestY);
        guestY += 4.5;
    }

    // BILLED FROM (Company Info)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("BILLED FROM:", col2X, topY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.text("Nilathra Collection", col2X, topY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    let companyY = topY + 10;
    if (appSettings?.[Settings.Address]) {
        const splitAddr = doc.splitTextToSize(appSettings[Settings.Address], 80);
        doc.text(splitAddr, col2X, companyY);
        companyY += (splitAddr.length * 4.5);
    } else {
        doc.text("Nilathra Hotel Management (Pvt) Ltd", col2X, companyY);
        doc.text("145/1 Vajira Rd, Colombo 00500", col2X, companyY + 4.5);
        companyY += 9;
    }
    doc.text(`Email: concierge@nilathra.com`, col2X, companyY);
    doc.text(`Web: www.nilathra.com`, col2X, companyY + 4.5);

    topY = Math.max(guestY, companyY + 9) + 8;

    // Items Table Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(20, topY, 170, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text("Description / Experience Component", 24, topY + 5);
    doc.text("Amount (USD)", 185, topY + 5, { align: 'right' });

    topY += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);

    const currency = invoice.currency || 'USD';
    const items = invoice.items || [];
    let itemsSubtotal = 0;

    for (const item of items) {
        itemsSubtotal += Number(item.amount || 0);
        const splitDesc = doc.splitTextToSize(item.description || 'Itinerary Service Item', 125);
        const cellHeight = Math.max(8, splitDesc.length * 4.5 + 2);

        if (topY + cellHeight > 260) {
            doc.addPage();
            topY = 20;
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(20, topY, 170, 7, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(255, 255, 255);
            doc.text("Description / Experience Component", 24, topY + 5);
            doc.text("Amount (USD)", 185, topY + 5, { align: 'right' });
            topY += 7;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
        }

        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.2);
        doc.line(20, topY + cellHeight, 190, topY + cellHeight);

        doc.text(splitDesc, 24, topY + 5);
        doc.text(`${currency} ${Number(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 185, topY + 5, { align: 'right' });

        topY += cellHeight;
    }

    topY += 6;
    if (topY > 240) {
        doc.addPage();
        topY = 20;
    }

    // Totals Section on Right Side
    const totalsX = 120;
    const totalsValX = 185;

    const totalPaid = (invoice.payments || []).reduce((sum: number, p: any) => {
        const amt = Number(p.amount) || 0;
        const rate = Number(p.exchange_rate) || 1.0;
        const usd = (!p.currency || p.currency === 'USD') ? amt : (rate > 0 ? amt / rate : amt);
        return sum + usd;
    }, 0);
    const balanceDue = Math.max(0, Number(invoice.amount || 0) - totalPaid);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);

    doc.text("Subtotal:", totalsX, topY);
    doc.text(`${currency} ${itemsSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, totalsValX, topY, { align: 'right' });
    topY += 5;



    if (invoice.tax_amount && invoice.tax_amount > 0) {
        doc.text("Tax Amount:", totalsX, topY);
        doc.text(`${currency} ${Number(invoice.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, totalsValX, topY, { align: 'right' });
        topY += 5;
    }

    if (invoice.discount_amount && invoice.discount_amount > 0) {
        doc.text("Discount / Adjustment:", totalsX, topY);
        doc.text(`-${currency} ${Number(invoice.discount_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, totalsValX, topY, { align: 'right' });
        topY += 5;
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(totalsX, topY, 190, topY);
    topY += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Total Invoice Amount:", totalsX, topY);
    doc.text(`${currency} ${Number(invoice.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, totalsValX, topY, { align: 'right' });
    topY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.text("Total Payments Received:", totalsX, topY);
    doc.text(`${currency} ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, totalsValX, topY, { align: 'right' });
    topY += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(balanceDue > 0 ? 180 : 27, balanceDue > 0 ? 80 : 120, balanceDue > 0 ? 20 : 45);
    doc.text("Balance Due:", totalsX, topY);
    doc.text(`${currency} ${balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, totalsValX, topY, { align: 'right' });
    topY += 10;

    // Agency Notes / Bank Details Section
    if (invoice.agency_note) {
        if (topY > 230) {
            doc.addPage();
            topY = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("PAYMENT INSTRUCTIONS & BANK DETAILS:", 20, topY);
        topY += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);

        const splitNotes = doc.splitTextToSize(invoice.agency_note, 170);
        doc.text(splitNotes, 20, topY);
    }

    // Page Numbers Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${totalPages}`, 105, 287, { align: 'center' });
        doc.text("Nilathra Collection - Luxury Unfiltered - Colombo, Sri Lanka", 20, 287);
    }

    return doc;
};
