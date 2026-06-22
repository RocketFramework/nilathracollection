import { RoomSizeName } from '@/types/types';

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

const getBase64OrLoad = async (src: string): Promise<string> => {
    if (src.startsWith('data:image/')) {
        return src;
    }
    return getBase64ImageFromUrl(src);
};

export const generateHotelPoPdf = async (
    hotel: any,
    stays: any[],
    appSettings: any,
    agentName: string,
    touristData: any,
    options: {
        requireSignature: boolean;
        signatureImage: string;
        poNumber?: string;
        discount?: number;
        tax?: number;
    }
): Promise<any> => {
    const jspdfModule = await loadJsPDF();
    if (!jspdfModule) return null;
    const { jsPDF } = jspdfModule;
    
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const primaryColor = [27, 58, 45]; // #1B3A2D
    const secondaryColor = [201, 168, 76]; // #C9A84C
    const charcoalColor = [51, 51, 51]; // #333333

    let topY = 20;
    let logoBottomY = 20;

    // Load Company Logo
    if (appSettings?.company_logo) {
        try {
            const logoBase64 = await getBase64ImageFromUrl(appSettings.company_logo);
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
            console.error("Failed to add logo to PO PDF:", e);
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

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("PURCHASE ORDER", 108, 28);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    
    const formattedDate = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    doc.text(`Date: ${formattedDate}`, 108, 34);
    
    // Sort stays by date / day number
    const sortedStays = [...stays].sort((a, b) => {
        const dayA = a.tour_itineraries?.day_number || a.day_number || a.dayNumber || 0;
        const dayB = b.tour_itineraries?.day_number || b.day_number || b.dayNumber || 0;
        return dayA - dayB;
    });

    const checkInDate = sortedStays[0]?.tour_itineraries?.date || '';
    const nightsCount = sortedStays.length;
    let checkOutDate = '';
    if (checkInDate) {
        const d = new Date(checkInDate);
        d.setDate(d.getDate() + nightsCount);
        checkOutDate = d.toISOString().split('T')[0];
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    };

    const poNum = options.poNumber || `PO-HOT-${Date.now().toString().slice(-6)}`;

    doc.text(`PO Number: ${poNum}`, 108, 39);
    doc.text(`Check-in: ${formatDate(checkInDate)}`, 108, 44);
    doc.text(`Check-out: ${formatDate(checkOutDate)}`, 108, 49);

    const lineY = Math.max(logoBottomY + 6, 54);
    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, lineY, 190, lineY);
    topY = lineY + 8;

    const col1X = 20;
    const col2X = 110;
    
    // Hotel info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("HOTEL RESERVATIONS TO:", col1X, topY);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.text(hotel?.name || 'Hotel Partner', col1X, topY + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let supplierY = topY + 10;
    if (hotel?.location_address) {
        const splitAddr = doc.splitTextToSize(hotel.location_address, 80);
        doc.text(splitAddr, col1X, supplierY);
        supplierY += (splitAddr.length * 4.5);
    }
    if (hotel?.hotel_class) {
        doc.text(`Class: ${hotel.hotel_class}`, col1X, supplierY);
        supplierY += 4.5;
    }
    if (hotel?.reservation_email) {
        doc.text(`Email: ${hotel.reservation_email}`, col1X, supplierY);
        supplierY += 4.5;
    }

    // Issuer Info (Nilathra Collection)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("FROM:", col2X, topY);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.text("Nilathra Collection", col2X, topY + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    let issuerY = topY + 10;
    if (appSettings?.address) {
        const splitIssuer = doc.splitTextToSize(appSettings.address, 80);
        doc.text(splitIssuer, col2X, issuerY);
        issuerY += (splitIssuer.length * 4.5);
    } else {
        doc.text("Nilathra Hotel Management (Pvt) Ltd", col2X, issuerY);
        doc.text("145/1 Vajira Rd, Colombo 00500", col2X, issuerY + 4.5);
        issuerY += 9;
    }
    doc.text(`Agent Name: ${agentName}`, col2X, issuerY);
    doc.text(`Email: concierge@nilathra.com`, col2X, issuerY + 4.5);

    const infoMaxY = Math.max(supplierY, issuerY + 9);
    topY = infoMaxY + 8;

    // Guest Occupancy details
    const adults = touristData?.preferences?.adults || 2;
    const children = touristData?.preferences?.children || 0;
    const infants = touristData?.preferences?.infants || 0;
    let occupancyStr = `${adults} Adults`;
    if (children > 0) occupancyStr += `, ${children} Children`;
    if (infants > 0) occupancyStr += `, ${infants} Infants`;

    doc.setFillColor(245, 243, 239);
    doc.rect(20, topY, 170, 15, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`GUEST DETAILS & OCCUPANCY:`, 24, topY + 6);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.text(occupancyStr, 24, topY + 11);

    topY += 21;

    // Requested stays table
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(20, topY, 170, 7, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text("Stay Date / Day", 24, topY + 5);
    doc.text("Room Category", 75, topY + 5);
    doc.text("Meal Plan", 125, topY + 5);
    doc.text("Qty", 148, topY + 5, { align: 'center' });
    doc.text("Unit Rate", 168, topY + 5, { align: 'right' });
    doc.text("Total", 188, topY + 5, { align: 'right' });
    
    topY += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);

    let calculatedSubtotal = 0;

    for (const act of sortedStays) {
        const room = hotel?.hotel_rooms?.find((r: any) => r.id === act.hotel_room_id);
        const dayNum = act.tour_itineraries?.day_number || act.day_number || act.dayNumber || 0;
        const dateVal = act.tour_itineraries?.date;
        const displayDate = dateVal ? formatDate(dateVal) : `Day ${dayNum}`;

        const sizes: RoomSizeName[] = ['single_room', 'double_room', 'twin_room', 'triple_room', 'family_room'];
        const activeRooms = sizes.map(size => {
            const count = (act as any)[`${size}_count`] || 0;
            const label = size.split('_')[0];
            const displayType = label.charAt(0).toUpperCase() + label.slice(1);
            return { type: displayType, count };
        }).filter(r => r.count > 0);

        let roomDesc = '';
        let totalQty = 0;
        let mealPlanText = act.meal_plan || 'BB';

        if (act.isCustomPO) {
            const descSuffix = act.description ? ` - ${act.description}` : '';
            roomDesc = `Custom: ${act.title || act.name || 'Additional Service'}${descSuffix}`;
            totalQty = act.quantity || 1;
            const customType = act.activity_type || act.type || 'service';
            mealPlanText = customType.charAt(0).toUpperCase() + customType.slice(1);
        } else if (activeRooms.length === 0) {
            roomDesc = room?.room_name ? (room.room_standard ? `${room.room_name} (${room.room_standard})` : room.room_name) : 'Room Details TBD';
            totalQty = act.quantity || 1;
        } else {
            roomDesc = activeRooms.map(r => `${r.count} x ${r.type}`).join(', ');
            totalQty = activeRooms.reduce((acc, r) => acc + r.count, 0);
        }

        const unitCost = Number(act.contracted_price ?? act.charged_unit_price ?? 0);
        const totalCost = Number(act.contracted_total_price ?? (totalQty * unitCost));
        calculatedSubtotal += totalCost;

        const splitDesc = doc.splitTextToSize(roomDesc, 48);
        const cellHeight = Math.max(8, splitDesc.length * 4.5 + 2);

        if (topY + cellHeight > 270) {
            doc.addPage();
            topY = 20;
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(20, topY, 170, 7, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(255, 255, 255);
            doc.text("Stay Date / Day", 24, topY + 5);
            doc.text("Room Category", 75, topY + 5);
            doc.text("Meal Plan", 125, topY + 5);
            doc.text("Qty", 148, topY + 5, { align: 'center' });
            doc.text("Unit Rate", 168, topY + 5, { align: 'right' });
            doc.text("Total", 188, topY + 5, { align: 'right' });
            topY += 7;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
        }

        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.2);
        doc.line(20, topY + cellHeight, 190, topY + cellHeight);

        doc.text(displayDate, 24, topY + 5);
        doc.text(splitDesc, 75, topY + 5);
        doc.text(mealPlanText, 125, topY + 5);
        doc.text(String(totalQty), 148, topY + 5, { align: 'center' });
        doc.text(`$${unitCost.toFixed(2)}`, 168, topY + 5, { align: 'right' });
        doc.text(`$${totalCost.toFixed(2)}`, 188, topY + 5, { align: 'right' });

        topY += cellHeight;
    }

    topY += 8;
    if (topY > 230) {
        doc.addPage();
        topY = 20;
    }

    // Totals Section
    const disc = options.discount || 0;
    const tx = options.tax || 0;
    const finalTotal = calculatedSubtotal + tx - disc;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);

    if (disc > 0 || tx > 0) {
        doc.text("Subtotal:", 118, topY);
        doc.text(`$${calculatedSubtotal.toFixed(2)}`, 188, topY, { align: 'right' });
        topY += 5.5;

        if (disc > 0) {
            doc.text("Discount:", 118, topY);
            doc.text(`-$${disc.toFixed(2)}`, 188, topY, { align: 'right' });
            topY += 5.5;
        }

        if (tx > 0) {
            doc.text("Tax:", 118, topY);
            doc.text(`+$${tx.toFixed(2)}`, 188, topY, { align: 'right' });
            topY += 5.5;
        }
        
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.line(118, topY - 1.5, 190, topY - 1.5);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Total Amount Payable:", 118, topY);
    doc.text(`$${finalTotal.toFixed(2)}`, 188, topY, { align: 'right' });
    topY += 12;

    // Digital Signature Placement
    if (options.requireSignature && options.signatureImage) {
        try {
            const sigBase64 = await getBase64OrLoad(options.signatureImage);
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("AUTHORIZED REPRESENTATIVE SIGNATURE:", 20, topY);
            
            // Draw signature image
            doc.addImage(sigBase64, 'PNG', 20, topY + 3, 40, 16);
            
            doc.setDrawColor(180, 180, 180);
            doc.setLineWidth(0.25);
            doc.line(20, topY + 20, 75, topY + 20);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
            doc.text("Nilathra Collection Operations", 20, topY + 23.5);
            
            topY += 28;
        } catch (e) {
            console.error("Failed to add digital signature to PO PDF:", e);
        }
    }

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
