import { RoomSizeName, Settings } from '@/types/types';

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
        mealProvided?: boolean;
        accommodationProvided?: boolean;
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

    const standardStaysOnly = sortedStays.filter(s => s && !s.isCustomPO && (s.activity_type === 'sleep' || s.type === 'sleep'));
    let checkInDate = '';
    let nightsCount = 0;
    if (standardStaysOnly.length > 0) {
        checkInDate = standardStaysOnly[0]?.tour_itineraries?.date || '';
        nightsCount = standardStaysOnly.length;
    } else {
        const serviceDates = sortedStays.map(s => s.service_date || s.tour_itineraries?.date).filter(Boolean);
        if (serviceDates.length > 0) {
            checkInDate = serviceDates[0];
            nightsCount = serviceDates.length;
        }
    }
    let checkOutDate = '';
    if (checkInDate && nightsCount > 0) {
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
    if (appSettings?.[Settings.Address]) {
        const splitIssuer = doc.splitTextToSize(appSettings[Settings.Address], 80);
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

    const sleepStays = sortedStays.filter(s => s && !s.isCustomPO && (s.activity_type === 'sleep' || s.type === 'sleep'));
    const customStays = sortedStays.filter(s => s && (s.isCustomPO || (s.activity_type !== 'sleep' && s.type !== 'sleep')));

    let calculatedSubtotal = 0;

    // 1. Render sleepStays table
    if (sleepStays.length > 0) {
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

        for (const act of sleepStays) {
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

            if (activeRooms.length === 0) {
                roomDesc = room?.room_name ? (room.room_standard ? `${room.room_name} (${room.room_standard})` : room.room_name) : 'Room Details TBD';
                totalQty = act.quantity || 1;
            } else {
                roomDesc = activeRooms.map(r => `${r.count} x ${r.type}`).join(', ');
                totalQty = activeRooms.reduce((acc, r) => acc + r.count, 0);
            }

            if (act.description) {
                roomDesc += ` - ${act.description}`;
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
    }

    // 2. Render customStays table
    if (customStays.length > 0) {
        topY += (sleepStays.length > 0 ? 10 : 0);
        if (topY > 250) {
            doc.addPage();
            topY = 20;
        }

        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(20, topY, 170, 7, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(255, 255, 255);
        doc.text("Service Date / Day", 24, topY + 5);
        doc.text("Requested Service / Activity", 75, topY + 5);
        doc.text("Qty", 148, topY + 5, { align: 'center' });
        doc.text("Unit Rate", 168, topY + 5, { align: 'right' });
        doc.text("Total", 188, topY + 5, { align: 'right' });
        
        topY += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);

        for (const act of customStays) {
            const dayNum = act.tour_itineraries?.day_number || act.day_number || act.dayNumber || 0;
            const dateVal = act.service_date || act.tour_itineraries?.date;
            const displayDate = dateVal ? formatDate(dateVal) : (dayNum > 0 ? `Day ${dayNum}` : 'TBD');

            const descSuffix = act.description ? ` - ${act.description}` : '';
            const roomDesc = `${act.title || act.name || 'Additional Service'}${descSuffix}`;
            const totalQty = act.quantity || 1;

            const unitCost = Number(act.contracted_price ?? act.charged_unit_price ?? 0);
            const totalCost = Number(act.contracted_total_price ?? (totalQty * unitCost));
            calculatedSubtotal += totalCost;

            const splitDesc = doc.splitTextToSize(roomDesc, 68);
            const cellHeight = Math.max(8, splitDesc.length * 4.5 + 2);

            if (topY + cellHeight > 270) {
                doc.addPage();
                topY = 20;
                doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.rect(20, topY, 170, 7, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8.5);
                doc.setTextColor(255, 255, 255);
                doc.text("Service Date / Day", 24, topY + 5);
                doc.text("Requested Service / Activity", 75, topY + 5);
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
            doc.text(String(totalQty), 148, topY + 5, { align: 'center' });
            doc.text(`$${unitCost.toFixed(2)}`, 168, topY + 5, { align: 'right' });
            doc.text(`$${totalCost.toFixed(2)}`, 188, topY + 5, { align: 'right' });

            topY += cellHeight;
        }
    }

    topY += 8;

    const hasDriverMeal = stays.some(s => s && s.driver_meal_included);
    const hasDriverAcc = stays.some(s => s && s.driver_acc_included);
    const hasParking = stays.some(s => s && s.parking_included);
    const guideRoomDisc = stays.find(s => s && s.guide_room_discount)?.guide_room_discount;

    const agreedInclusions: string[] = [];
    if (hasDriverMeal) agreedInclusions.push("Driver Meals: Included");
    if (hasDriverAcc) agreedInclusions.push("Driver Accommodation: Provided FOC");
    if (hasParking) agreedInclusions.push("On-Site Parking: Included");
    if (guideRoomDisc && guideRoomDisc !== 'None') {
        agreedInclusions.push(`Guide Room Discount: ${guideRoomDisc}`);
    }
    if (options.mealProvided) agreedInclusions.push("Meal Provided: Yes");
    if (options.accommodationProvided) agreedInclusions.push("Accommodation Provided: Yes");

    if (agreedInclusions.length > 0) {
        if (topY + (agreedInclusions.length * 4.5) + 12 > 270) {
            doc.addPage();
            topY = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("AGREED SPECIAL INCLUSIONS / SERVICES:", 20, topY);
        topY += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);

        agreedInclusions.forEach((inc, idx) => {
            doc.text(`- ${inc}`, 24, topY + (idx * 4.5));
        });
        topY += (agreedInclusions.length * 4.5) + 6;
    }

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

/**
 * Generates a transport-specific Purchase Order PDF.
 * Mirrors the hotel PO layout but replaces room/stay tables with:
 *   - PO Summary (provider, duration, vehicle count, total)
 *   - Vehicle Specs (make, qty, model year, day rate)
 *   - Chauffeur Requirements
 *   - Day-by-day Route Schedule table (Day | Date | From→To | Est. KM | Day Rate | Total)
 */
export const generateTransportPoPdf = async (
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
        transportRequirement?: any;
        poBlockId?: string;
    }
): Promise<any> => {
    const jspdfModule = await loadJsPDF();
    if (!jspdfModule) return null;
    const { jsPDF } = jspdfModule;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const primaryColor   = [27, 58, 45];    // #1B3A2D
    const secondaryColor = [201, 168, 76];  // #C9A84C
    const charcoalColor  = [51, 51, 51];    // #333333
    const lightBg        = [245, 243, 239]; // #F5F3EF
    const headerBg       = [234, 232, 228]; // #EAE8E4

    let topY = 20;
    let logoBottomY = 20;

    // ─── Logo ────────────────────────────────────────────────────────────────
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
        } catch {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text('NILATHRA COLLECTION', 20, topY + 10);
            logoBottomY = topY + 15;
        }
    } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('NILATHRA COLLECTION', 20, topY + 10);
        logoBottomY = topY + 15;
    }

    // ─── PO Title + Meta (top-right) ─────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('PURCHASE ORDER', 108, 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);

    const formattedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const poNum = options.poNumber || `PO-TRA-${Date.now().toString().slice(-6)}`;

    doc.text(`Date: ${formattedDate}`, 108, 34);
    doc.text(`PO Number: ${poNum}`, 108, 39);
    doc.text(`Vendor Type: Transport Provider`, 108, 44);

    // ─── Divider ─────────────────────────────────────────────────────────────
    const lineY = Math.max(logoBottomY + 6, 52);
    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, lineY, 190, lineY);
    topY = lineY + 8;

    // ─── Supplier & Issuer columns ────────────────────────────────────────────
    const col1X = 20;
    const col2X = 110;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('TRANSPORT SERVICES TO:', col1X, topY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.text(hotel?.name || 'Transport Provider', col1X, topY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let supplierY = topY + 10;
    if (hotel?.address || hotel?.location_address) {
        const addr = hotel.address || hotel.location_address;
        const splitAddr = doc.splitTextToSize(addr, 80);
        doc.text(splitAddr, col1X, supplierY);
        supplierY += splitAddr.length * 4.5;
    }
    if (hotel?.reservation_email || hotel?.email) {
        doc.text(`Email: ${hotel.reservation_email || hotel.email}`, col1X, supplierY);
        supplierY += 4.5;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('FROM:', col2X, topY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.text('Nilathra Collection', col2X, topY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let issuerY = topY + 10;
    if (appSettings?.[Settings.Address]) {
        const splitIssuer = doc.splitTextToSize(appSettings[Settings.Address], 80);
        doc.text(splitIssuer, col2X, issuerY);
        issuerY += splitIssuer.length * 4.5;
    } else {
        doc.text('Nilathra Hotel Management (Pvt) Ltd', col2X, issuerY);
        doc.text('145/1 Vajira Rd, Colombo 00500', col2X, issuerY + 4.5);
        issuerY += 9;
    }
    doc.text(`Agent: ${agentName}`, col2X, issuerY);
    doc.text('Email: concierge@nilathra.com', col2X, issuerY + 4.5);

    topY = Math.max(supplierY, issuerY + 9) + 8;

    // ─── Guest info bar ───────────────────────────────────────────────────────
    const adults   = touristData?.preferences?.adults   || 2;
    const children = touristData?.preferences?.children || 0;
    const infants  = touristData?.preferences?.infants  || 0;
    let occupancyStr = `${adults} Adults`;
    if (children > 0) occupancyStr += `, ${children} Children`;
    if (infants  > 0) occupancyStr += `, ${infants} Infants`;

    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(20, topY, 170, 13, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('GUEST OCCUPANCY:', 24, topY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.text(occupancyStr, 24, topY + 10);
    topY += 19;

    // ─── Transport Requirement data ───────────────────────────────────────────
    const tpReq: any     = options.transportRequirement || stays[0]?.transport_requirement || {};
    const tpVehicles: any[] = tpReq.transport_requirement_vehicles || [];

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        try {
            const d = new Date(dateStr);
            return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch { return dateStr; }
    };

    // ─── Vehicle Specs Section ────────────────────────────────────────────────
    if (topY > 240) { doc.addPage(); topY = 20; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('AGREED VEHICLE DETAILS', 20, topY);
    topY += 5;

    // Header row
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(20, topY, 170, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('Vehicle Make / Type', 24,  topY + 5);
    doc.text('Qty',                100,  topY + 5, { align: 'center' });
    doc.text('Model Year',         125,  topY + 5);
    doc.text('Day Rate (USD)',      188,  topY + 5, { align: 'right' });
    topY += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);

    if (tpVehicles.length > 0) {
        tpVehicles.forEach((rv: any, idx: number) => {
            const v      = rv.vehicle || {};
            const label  = v.make_and_model || v.make || tpReq.vehicle_make || 'Vehicle';
            const type   = v.vehicle_type ? ` (${v.vehicle_type})` : '';
            const qty    = rv.quantity || 1;
            const yr     = (() => {
                const s = tpReq.vehicle_model_year || '';
                if (!s) return 'Any';
                try { const d = new Date(s); return isNaN(d.getTime()) ? s : String(d.getFullYear()); } catch { return s; }
            })();
            const rate   = Number(v.day_rate) || 0;

            if (idx % 2 === 1) {
                doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
                doc.rect(20, topY, 170, 7, 'F');
            }

            doc.setDrawColor(230, 230, 230);
            doc.setLineWidth(0.2);
            doc.line(20, topY + 7, 190, topY + 7);

            const splitLabel = doc.splitTextToSize(`${label}${type}`, 70);
            doc.text(splitLabel, 24, topY + 5);
            doc.text(String(qty), 100, topY + 5, { align: 'center' });
            doc.text(yr, 125, topY + 5);
            doc.text(rate > 0 ? `$${rate.toFixed(2)} / day` : 'As quoted', 188, topY + 5, { align: 'right' });
            topY += 7;
        });
    } else {
        doc.text('As per agreed quotation', 24, topY + 5);
        doc.setDrawColor(230, 230, 230); doc.line(20, topY + 7, 190, topY + 7);
        topY += 7;
    }

    topY += 10;

    // ─── Chauffeur Requirements ───────────────────────────────────────────────
    const chauffeurLines: string[] = [];
    if (tpReq.chauffeur_required !== false)        chauffeurLines.push('Chauffeur: Required');
    if (tpReq.chauffeur_speak_english !== false)   chauffeurLines.push('English Speaking: Yes');
    if (tpReq.chauffeur_other_languages)           chauffeurLines.push(`Other Languages: ${tpReq.chauffeur_other_languages}`);
    if (tpReq.chauffeur_accommodation_needed)      chauffeurLines.push('Chauffeur Accommodation: Included');
    if (tpReq.chauffeur_meal_needed)               chauffeurLines.push('Chauffeur Meals: Included');

    if (chauffeurLines.length > 0) {
        if (topY + (chauffeurLines.length * 4.5) + 14 > 270) { doc.addPage(); topY = 20; }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('CHAUFFEUR REQUIREMENTS', 20, topY);
        topY += 5;

        doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
        doc.rect(20, topY, 170, chauffeurLines.length * 5 + 4, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
        chauffeurLines.forEach((line, i) => {
            doc.text(`- ${line}`, 24, topY + 5 + i * 5);
        });
        topY += chauffeurLines.length * 5 + 10;
    }

    // ─── Day-by-Day Route Schedule ────────────────────────────────────────────
    if (topY > 220) { doc.addPage(); topY = 20; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('CONFIRMED TRANSPORT SCHEDULE', 20, topY);
    topY += 5;

    // Table header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(20, topY, 170, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('Day',          24,  topY + 5);
    doc.text('Date',         44,  topY + 5);
    doc.text('From',         74,  topY + 5);
    doc.text('To',           130, topY + 5);
    doc.text('Day Rate',     188, topY + 5, { align: 'right' });
    topY += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);

    // Group by service_date
    const sortedStays = [...stays].sort((a, b) => {
        const dayA = a.tour_itineraries?.day_number || a.day_number || 0;
        const dayB = b.tour_itineraries?.day_number || b.day_number || 0;
        return dayA - dayB;
    });

    const dayGroups: Record<string, any[]> = {};
    for (const leg of sortedStays) {
        const key = leg.service_date
            ? new Date(leg.service_date).toISOString().split('T')[0]
            : leg.tour_itineraries?.date
                ? new Date(leg.tour_itineraries.date).toISOString().split('T')[0]
                : `day-${leg.tour_itineraries?.day_number ?? 'x'}`;
        if (!dayGroups[key]) dayGroups[key] = [];
        dayGroups[key].push(leg);
    }

    let tpSubtotal = 0;
    const dayEntries = Object.entries(dayGroups).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);

    dayEntries.forEach(([dateKey, legs], idx) => {
        if (topY + 8 > 270) { doc.addPage(); topY = 20; }

        const first   = legs[0] as any;
        const last    = legs[legs.length - 1] as any;
        const dayNum  = first.tour_itineraries?.day_number || first.day_number || idx + 1;
        const dispDate = dateKey.startsWith('day-') ? `Day ${dayNum}` : formatDate(dateKey);
        const from    = first.pickup_location || first.location_name || 'Origin';
        const to      = last.dropoff_location  || last.destination_location || last.location_name || 'Destination';
        const totalKm = legs.reduce((s: number, l: any) => s + (Number(l.quantity) || 0), 0);

        // Use the contracted total price of the legs if they have been set (e.g. from "Apply Vehicle Day Rates" or custom overrides)
        let dayRate = legs.reduce((s: number, l: any) => s + (Number(l.contracted_total_price) || 0), 0);
        
        // If no contracted total price is set, fall back to calculating from vehicle day rates + mileage surcharge
        if (dayRate === 0) {
            let baseRate = 0;
            for (const rv of tpVehicles) {
                const v = rv.vehicle || {};
                baseRate += (Number(v.day_rate) || 0) * (Number(rv.quantity) || 1);
            }

            const maxMileage = tpVehicles.reduce((sum: number, trv: any) => {
                const v = trv.vehicle;
                return sum + ((Number(v?.max_km_per_day) || 80) * (Number(trv.quantity) || 1));
            }, 0);

            const extraKmRate = tpVehicles.reduce((sum: number, trv: any) => {
                const v = trv.vehicle;
                return sum + ((Number(v?.additional_km_rate) || 0) * (Number(trv.quantity) || 1));
            }, 0);

            const totalDistance = legs.reduce((sum: number, t: any) => sum + (parseFloat(String(t.distance || '').replace(/[^\d.]/g, '')) || 0), 0);
            const excessDistance = Math.max(0, totalDistance - maxMileage);
            const extraKmCost = excessDistance * extraKmRate;
            dayRate = baseRate + extraKmCost;
        }
        tpSubtotal += dayRate;

        if (idx % 2 === 1) {
            doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
            doc.rect(20, topY, 170, 8, 'F');
        }
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.2);
        doc.line(20, topY + 8, 190, topY + 8);

        doc.setFont('helvetica', 'bold');
        doc.text(`Day ${dayNum}`, 24, topY + 5.5);
        doc.setFont('helvetica', 'normal');
        doc.text(dispDate, 44, topY + 5.5);

        const fromSplit = doc.splitTextToSize(from, 50);
        const toSplit   = doc.splitTextToSize(to,   50);
        doc.text(fromSplit, 74,  topY + 5.5);
        doc.text(toSplit,   130, topY + 5.5);
        doc.text(dayRate > 0 ? `$${dayRate.toFixed(2)}` : 'As quoted', 188, topY + 5.5, { align: 'right' });

        topY += 8;
    });

    // Totals footer row
    const disc       = options.discount || 0;
    const tx         = options.tax      || 0;
    const finalTotal = tpSubtotal + tx - disc;

    doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
    doc.rect(20, topY, 170, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Total PO Amount', 24, topY + 5);
    doc.text(tpSubtotal > 0 ? `$${tpSubtotal.toFixed(2)}` : 'As per quotation', 188, topY + 5, { align: 'right' });
    topY += 12;

    // Discount / tax lines
    if (disc > 0 || tx > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
        if (disc > 0) {
            doc.text('Discount:', 118, topY);
            doc.text(`-$${disc.toFixed(2)}`, 188, topY, { align: 'right' });
            topY += 5.5;
        }
        if (tx > 0) {
            doc.text('Tax:', 118, topY);
            doc.text(`+$${tx.toFixed(2)}`, 188, topY, { align: 'right' });
            topY += 5.5;
        }
        doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.2);
        doc.line(118, topY - 1.5, 190, topY - 1.5);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('Total Amount Payable:', 118, topY);
        doc.text(`$${finalTotal.toFixed(2)}`, 188, topY, { align: 'right' });
        topY += 12;
    }

    // ─── Terms note ──────────────────────────────────────────────────────────
    if (topY + 20 > 270) { doc.addPage(); topY = 20; }
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    const termsText = 'Rates are inclusive of fuel, tolls, and standard driver allowances. Additional charges for excess kilometres must be pre-agreed. This document constitutes a binding Purchase Order upon acknowledgement.';
    const termsSplit = doc.splitTextToSize(termsText, 170);
    doc.text(termsSplit, 20, topY);
    topY += termsSplit.length * 4.5 + 8;

    // ─── Signature ───────────────────────────────────────────────────────────
    if (options.requireSignature && options.signatureImage) {
        if (topY + 32 > 270) { doc.addPage(); topY = 20; }
        try {
            const sigBase64 = await getBase64OrLoad(options.signatureImage);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text('AUTHORIZED REPRESENTATIVE SIGNATURE:', 20, topY);
            doc.addImage(sigBase64, 'PNG', 20, topY + 3, 40, 16);
            doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.25);
            doc.line(20, topY + 20, 75, topY + 20);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
            doc.text('Nilathra Collection Operations', 20, topY + 23.5);
            topY += 28;
        } catch (e) {
            console.error('Failed to add signature to transport PO PDF:', e);
        }
    }

    // ─── Page footers ────────────────────────────────────────────────────────
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${totalPages}`, 105, 287, { align: 'center' });
        doc.text('Nilathra Collection - Luxury Unfiltered - Colombo, Sri Lanka', 20, 287);
    }

    return doc;
};

