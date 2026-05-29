"use client";

import { TripData, Financials } from "../types";
import { useState, useEffect, useRef } from "react";
import { Calculator, RefreshCw, FileText, ChevronDown, ChevronUp, Mail, Send, X, CheckCircle, AlertCircle, LayoutTemplate, Type, User, MessageSquare } from "lucide-react";

import { 
    getFinalizedActivitiesAction, 
    savePurchaseOrderAction, 
    getPurchaseOrdersAction, 
    deleteDraftPurchaseOrdersAction, 
    getTransportProvidersAction, 
    getHotelsListAction, 
    getRestaurantsAction, 
    getVendorsAction,
    sendPurchaseOrderEmailAction,
    getEmailTemplatesAction
} from "@/actions/admin.actions";

const loadJsPDF = () => {
    return new Promise<any>((resolve, reject) => {
        if ((window as any).jspdf) {
            resolve((window as any).jspdf);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            resolve((window as any).jspdf);
        };
        script.onerror = (err) => {
            reject(err);
        };
        document.body.appendChild(script);
    });
};

const getBase64ImageFromUrl = (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                const dataURL = canvas.toDataURL('image/png');
                resolve(dataURL);
            } else {
                reject(new Error('Could not get canvas context'));
            }
        };
        img.onerror = (error) => {
            reject(error);
        };
        img.src = imageUrl;
    });
};

const getImageDimensions = (base64: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => {
            resolve({ width: 40, height: 16 }); // Default fallback dimensions
        };
        img.src = base64;
    });
};

const generatePoPdf = async (po: any, logoBase64?: string): Promise<string> => {
    const { jsPDF } = await loadJsPDF();
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
    if (logoBase64) {
        try {
            const dims = await getImageDimensions(logoBase64);
            const aspectRatio = dims.width / dims.height;
            let logoWidth = 40;
            let logoHeight = logoWidth / aspectRatio;
            
            // Constrain logo height if it exceeds 16mm to keep layout neat
            if (logoHeight > 16) {
                logoHeight = 16;
                logoWidth = logoHeight * aspectRatio;
            }

            doc.addImage(logoBase64, 'PNG', 20, topY, logoWidth, logoHeight);
            logoBottomY = topY + logoHeight;
        } catch (e) {
            console.error("Failed to add logo image to PDF:", e);
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
    doc.setFontSize(20);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("PURCHASE ORDER", 125, 28);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.text(`PO Number: ${po.po_number}`, 125, 34);
    doc.text(`PO Date: ${po.po_date}`, 125, 39);
    doc.text(`Currency: ${po.currency || 'USD'}`, 125, 44);
    doc.text(`Status: ${po.status}`, 125, 49);

    // The right-side metadata block ends at y=49. Ensure line is drawn below both blocks
    const lineY = Math.max(logoBottomY + 6, 54);

    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, lineY, 190, lineY);
    topY = lineY + 8;

    const col1X = 20;
    const col2X = 110;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("SUPPLIER:", col1X, topY);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.text(po.vendor_name || 'Vendor', col1X, topY + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let supplierY = topY + 10;
    if (po.vendor_address) {
        const splitAddr = doc.splitTextToSize(po.vendor_address, 80);
        doc.text(splitAddr, col1X, supplierY);
        supplierY += (splitAddr.length * 4.5);
    }
    if (po.vendor_phone) {
        doc.text(`Phone: ${po.vendor_phone}`, col1X, supplierY);
        supplierY += 4.5;
    }
    if (po.vendor_email) {
        doc.text(`Email: ${po.vendor_email}`, col1X, supplierY);
        supplierY += 4.5;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("ISSUER:", col2X, topY);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.text("Nilathra Collection", col2X, topY + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text("Nilathra Hotel Management (Pvt) Ltd", col2X, topY + 10);
    doc.text("Colombo, Sri Lanka", col2X, topY + 14.5);
    doc.text("Phone: +94 77 727 8282", col2X, topY + 19);
    doc.text("Email: concierge@nilathra.com", col2X, topY + 23.5);

    const infoMaxY = Math.max(supplierY, topY + 26);
    topY = infoMaxY + 8;

    if (po.vendor_notes) {
        doc.setFillColor(245, 243, 239);
        doc.rect(20, topY, 170, 22, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("GUEST DETAILS & OPERATIONAL NOTES:", 24, topY + 6);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
        const splitNotes = doc.splitTextToSize(po.vendor_notes, 162);
        doc.text(splitNotes, 24, topY + 11);
        topY += 27;
    }

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(20, topY, 170, 7, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text("Description", 24, topY + 5);
    doc.text("Service Date", 100, topY + 5);
    doc.text("Qty", 135, topY + 5, { align: 'center' });
    doc.text("Rate", 155, topY + 5, { align: 'right' });
    doc.text("Total", 185, topY + 5, { align: 'right' });
    
    topY += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    
    const items = po.items || [];
    const sortedItems = [...items].sort((a, b) => {
        if (!a.service_date) return 1;
        if (!b.service_date) return -1;
        return new Date(a.service_date).getTime() - new Date(b.service_date).getTime();
    });

    for (const item of sortedItems) {
        const descLines = doc.splitTextToSize(item.description, 72);
        const notesLines = item.special_notes ? doc.splitTextToSize(item.special_notes, 72) : [];
        const cellHeight = Math.max(8, (descLines.length + notesLines.length) * 4.5 + 4);

        if (topY + cellHeight > 270) {
            doc.addPage();
            topY = 20;
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(20, topY, 170, 7, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(255, 255, 255);
            doc.text("Description", 24, topY + 5);
            doc.text("Service Date", 100, topY + 5);
            doc.text("Qty", 135, topY + 5, { align: 'center' });
            doc.text("Rate", 155, topY + 5, { align: 'right' });
            doc.text("Total", 185, topY + 5, { align: 'right' });
            topY += 7;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
        }

        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.2);
        doc.line(20, topY + cellHeight, 190, topY + cellHeight);

        doc.setFont('helvetica', 'bold');
        let textY = topY + 5;
        doc.text(descLines, 24, textY);
        
        if (item.special_notes) {
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(190, 90, 20);
            doc.text(notesLines, 24, textY + (descLines.length * 4.5));
            doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
        }
        
        doc.setFont('helvetica', 'normal');
        const sDate = item.service_date ? new Date(item.service_date).toLocaleDateString() : '-';
        doc.text(sDate, 100, topY + 5);
        doc.text(String(item.quantity), 135, topY + 5, { align: 'center' });
        doc.text(`$${(item.unit_price || 0).toFixed(2)}`, 155, topY + 5, { align: 'right' });
        doc.text(`$${(item.total_price || 0).toFixed(2)}`, 185, topY + 5, { align: 'right' });

        topY += cellHeight;
    }

    const summaryHeight = 25;
    if (topY + summaryHeight > 270) {
        doc.addPage();
        topY = 20;
    }

    topY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    
    let summaryY = topY;
    if (po.discount > 0) {
        doc.text("Discount:", 155, summaryY, { align: 'right' });
        doc.text(`-$${(po.discount || 0).toFixed(2)}`, 185, summaryY, { align: 'right' });
        summaryY += 4.5;
    }
    if (po.service_charge > 0) {
        doc.text("Markup / Service Charge:", 155, summaryY, { align: 'right' });
        doc.text(`+$${(po.service_charge || 0).toFixed(2)}`, 185, summaryY, { align: 'right' });
        summaryY += 4.5;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Total Amount Payable:", 135, summaryY + 2);
    doc.text(`$${(po.total_amount || 0).toFixed(2)}`, 185, summaryY + 2, { align: 'right' });

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${totalPages}`, 105, 287, { align: 'center' });
        doc.text("Nilathra Collection - Luxury Unfiltered - Colombo, Sri Lanka", 20, 287);
    }

    const pdfDataUri = doc.output('datauristring');
    const base64Content = pdfDataUri.split(',')[1];
    return base64Content;
};

export function FinanceAndBookingStep({
    tripData,
    updateFinancials
}: {
    tripData: TripData,
    updateFinancials: (f: Financials) => void
}) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [finalizedActivities, setFinalizedActivities] = useState<any[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
    const [isLoadingPOs, setIsLoadingPOs] = useState(false);
    const [expandedPO, setExpandedPO] = useState<string | null>(null);
    const tourId = tripData.id;

    // PDF Email states
    const [logoBase64, setLogoBase64] = useState<string>('');
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedPO, setSelectedPO] = useState<any | null>(null);
    const [emailToName, setEmailToName] = useState<string>('');
    const [emailTo, setEmailTo] = useState<string>('');
    const [emailFrom, setEmailFrom] = useState<string>('');
    const [emailSubject, setEmailSubject] = useState<string>('');
    const [emailBody, setEmailBody] = useState<string>('');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [showSendModal, setShowSendModal] = useState<boolean>(false);
    const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
    const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getBase64ImageFromUrl('/images/nilathra_logo-02.png')
            .then(base64 => setLogoBase64(base64))
            .catch(err => console.error("Error loading logo for PO PDF:", err));

        async function fetchTemplates() {
            try {
                const res = await getEmailTemplatesAction();
                if (res.success && res.templates) {
                    setTemplates(res.templates);
                }
            } catch (err) {
                console.error("Error loading email templates:", err);
            }
        }
        fetchTemplates();
    }, []);

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const tId = e.target.value;
        setSelectedTemplateId(tId);
        if (tId) {
            const template = templates.find(t => t.id === tId);
            if (template) {
                setEmailSubject(template.subject);
                setEmailBody(template.body_html);
                if (editorRef.current) {
                    editorRef.current.innerHTML = template.body_html;
                }
            }
        } else {
            setEmailSubject(`Purchase Order ${selectedPO?.po_number} - Nilathra Collection`);
            const defaultBody = `<p>Dear ${selectedPO?.vendor_name || 'Partner'},</p><p>Please find attached the Purchase Order <strong>${selectedPO?.po_number}</strong> for the upcoming service bookings.</p><p>Thank you for partnering with Nilathra Collection.</p>`;
            setEmailBody(defaultBody);
            if (editorRef.current) {
                editorRef.current.innerHTML = defaultBody;
            }
        }
    };

    const handleOpenSendModal = (po: any) => {
        setSelectedPO(po);
        setEmailToName(po.sent_to_name || po.vendor_name || '');
        setEmailTo(po.vendor_email || '');
        setEmailFrom('concierge@nilathra.com');
        setEmailSubject(`Purchase Order ${po.po_number} - Nilathra Collection`);
        setSelectedTemplateId('');
        const defaultBody = `<p>Dear ${po.vendor_name || 'Partner'},</p><p>Please find attached the Purchase Order <strong>${po.po_number}</strong> for the upcoming service bookings.</p><p>Thank you for partnering with Nilathra Collection.</p>`;
        setEmailBody(defaultBody);
        setEmailMessage(null);
        setShowSendModal(true);
        setTimeout(() => {
            if (editorRef.current) {
                editorRef.current.innerHTML = defaultBody;
            }
        }, 100);
    };

    const handleSendPO = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPO) return;
        setIsSendingEmail(true);
        setEmailMessage(null);

        try {
            const pdfBase64 = await generatePoPdf(selectedPO, logoBase64);
            const pdfFilename = `${selectedPO.po_number}.pdf`;

            const result = await sendPurchaseOrderEmailAction({
                to: emailTo,
                from: emailFrom,
                subject: emailSubject,
                body: emailBody,
                pdfBase64,
                pdfFilename,
                poId: selectedPO.id,
                sentToName: emailToName
            });

            if (result.success) {
                setEmailMessage({ type: 'success', text: "Purchase Order emailed successfully!" });
                setTimeout(() => {
                    setShowSendModal(false);
                    fetchPurchaseOrders();
                }, 2000);
            } else {
                setEmailMessage({ type: 'error', text: result.error || "Failed to send email." });
            }
        } catch (error: any) {
            console.error("Error sending PO:", error);
            setEmailMessage({ type: 'error', text: error.message || "An unexpected error occurred." });
        } finally {
            setIsSendingEmail(false);
        }
    };



    const fetchPurchaseOrders = async () => {
        if (!tourId) return;
        setIsLoadingPOs(true);
        try {
            const res = await getPurchaseOrdersAction(tourId);
            if (res.success) {
                setPurchaseOrders(res.pos || []);
            }
        } catch (error) {
            console.error("Failed to fetch POs:", error);
        } finally {
            setIsLoadingPOs(false);
        }
    };

    useEffect(() => {
        fetchPurchaseOrders();
    }, [tourId]);

    const syncWithItinerary = async () => {
        if (!tourId) {
            alert("Tour must be saved before generating POs.");
            return;
        }

        setIsSyncing(true);
        try {
            const result = await getFinalizedActivitiesAction(tourId);
            const transportRes = await getTransportProvidersAction();
            const allTransportProviders = transportRes.success ? transportRes.providers || [] : [];
            const hotelsRes = await getHotelsListAction();
            const allHotels = hotelsRes.success ? hotelsRes.hotels || [] : [];
            const restRes = await getRestaurantsAction();
            const allRestaurants = restRes.success ? restRes.restaurants || [] : [];
            const vendorsRes = await getVendorsAction();
            const allVendors = vendorsRes.success ? vendorsRes.vendors || [] : [];

            if (!result.success) {
                alert("Failed to fetch daily activities: " + result.error);
                return;
            }

            // Find all daily activity IDs that are already linked to active/sent POs (so we don't recreate them)
            const existingLinkedActivityIds = new Set<string>();
            purchaseOrders.forEach(po => {
                if (po.status !== 'Draft' && po.status !== 'Pending Confirmation') {
                    po.items?.forEach((item: any) => {
                        if (item.daily_activity_id) {
                            existingLinkedActivityIds.add(item.daily_activity_id);
                        }
                    });
                }
            });

            const activities = (result.activities || [])
                .filter(a => a.price_finalized === true)
                .filter(a => !existingLinkedActivityIds.has(a.id));

            if (activities.length === 0) {
                const totalFinalized = (result.activities || []).filter(a => a.price_finalized === true).length;
                if (totalFinalized > 0) {
                    alert("All finalized items are already linked to existing sent/confirmed purchase orders.");
                } else {
                    alert("There are no finalized items to generate PO, please go back to negotiation step and finalize price");
                }
                return;
            }

            // Keep valid records under the else part for the next step
            setFinalizedActivities(activities);

            // Filter for hotel activities
            const hotelActivities = activities.filter(a => 
                a.hotel_id && 
                a.contracted_price != null
            );

            // Generate shared guest details for PO vendor notes
            const guestCountry = tripData.profile?.departureCountry || tripData.travelers?.[0]?.nationality || 'Not Specified';
            const guestName = tripData.clientName || 'Not Specified';
            const totalKids = tripData.profile?.children || 0;
            const totalGuestCount = (tripData.profile?.adults || 0) + totalKids + (tripData.profile?.infants || 0);

            const guestDetails = `Guest Name: ${guestName}
Guest Country: ${guestCountry}
Total Guests: ${totalGuestCount} (${totalKids} Kids)`;

            // Clear old Draft POs before generating new ones
            await deleteDraftPurchaseOrdersAction(tourId);

            if (hotelActivities.length > 0) {
                // Group by hotel_id
                const hotelGroups = hotelActivities.reduce((acc, a) => {
                    if (!acc[a.hotel_id]) acc[a.hotel_id] = [];
                    acc[a.hotel_id].push(a);
                    return acc;
                }, {} as Record<string, any[]>);

                for (const [hotelId, _hotelActs] of Object.entries(hotelGroups)) {
                    const hotelActs = _hotelActs as any[];
                    const poId = crypto.randomUUID();
                    const poNumber = `PO-HOT-${Date.now().toString().slice(-6)}`;
                    
                    const firstAct = hotelActs[0];
                    const masterHotel = allHotels.find((h: any) => h.id === hotelId);
                    const hotelName = masterHotel?.name || firstAct.title || 'Unknown Hotel';
                    const locationName = firstAct.location_name || '';

                    let calculatedSubtotal = 0;
                    let actualTotal = 0;
                    const poItems: any[] = [];

                    for (const act of hotelActs) {
                        actualTotal += act.contracted_total_price != null 
                            ? Number(act.contracted_total_price) 
                            : (act.contracted_price || 0) * (act.quantity || 1);
                        
                        const roomTypes = [
                            { type: 'Single', count: act.single_room_count || 0, roomId: act.single_room_id },
                            { type: 'Double', count: act.double_room_count || 0, roomId: act.double_room_id },
                            { type: 'Twin', count: act.twin_room_count || 0, roomId: act.twin_room_id },
                            { type: 'Triple', count: act.triple_room_count || 0, roomId: act.triple_room_id },
                            { type: 'Family', count: act.family_room_count || 0, roomId: act.family_room_id }
                        ].filter(rt => rt.count > 0);

                        if (roomTypes.length === 0) {
                            roomTypes.push({ type: 'Standard Room', count: act.quantity || 1, roomId: undefined });
                        }

                        const driverAcc = act.driver_acc_included ? 'Yes' : 'No';
                        const parkingInc = act.parking_included ? 'Yes' : 'No';
                        const guideDisc = act.guide_room_discount || 'None';
                        
                        let specialNotes = `Driver accommodation include: ${driverAcc}\nParking Included: ${parkingInc}\nGuide Room discount: ${guideDisc}`;

                        let serviceDate = '';
                        if (tripData.profile?.arrivalDate) {
                            const matchingBlock = tripData.itinerary.find(b => b.id === act.id);
                            if (matchingBlock && matchingBlock.dayNumber) {
                                const dateObj = new Date(tripData.profile.arrivalDate);
                                dateObj.setDate(dateObj.getDate() + (matchingBlock.dayNumber - 1));
                                serviceDate = dateObj.toISOString().split('T')[0];
                            }
                        }

                        let actCalculatedTotal = 0;
                        const actPoItems: any[] = [];

                        roomTypes.forEach((rt) => {
                            const itemQty = rt.count;
                            const itemUnitPrice = act.contracted_price || 0;
                            const itemCalculatedTotal = itemQty * itemUnitPrice;

                            let actualRoomName = rt.type;
                            if (rt.roomId && masterHotel && (masterHotel as any).hotel_rooms) {
                                const matchedRoom = (masterHotel as any).hotel_rooms.find((hr: any) => hr.id === rt.roomId);
                                if (matchedRoom && matchedRoom.room_name) {
                                    actualRoomName = matchedRoom.room_name;
                                }
                            }

                            actCalculatedTotal += itemCalculatedTotal;
                            calculatedSubtotal += itemCalculatedTotal;

                            actPoItems.push({
                                id: crypto.randomUUID(),
                                purchase_order_id: poId,
                                daily_activity_id: act.id,
                                description: `${hotelName} - ${actualRoomName} (${rt.type})`,
                                service_date: serviceDate,
                                quantity: itemQty,
                                unit_price: itemUnitPrice,
                                total_price: itemCalculatedTotal,
                                room_type: actualRoomName,
                                meal_plan: act.meal_plan || 'BB',
                                special_notes: specialNotes
                            });
                        });

                        // Add difference note to the first room type of this block if there's a markup/discount
                        const contractedTotalExpected = act.contracted_total_price != null 
                            ? Number(act.contracted_total_price) 
                            : (act.contracted_price || 0) * (act.quantity || 1);
                        if (actCalculatedTotal !== contractedTotalExpected && actPoItems.length > 0) {
                            const diff = contractedTotalExpected - actCalculatedTotal;
                            const diffNote = diff > 0 
                                ? `Includes Markup: $${diff.toLocaleString(undefined, {minimumFractionDigits: 2})}`
                                : `Includes Discount: $${Math.abs(diff).toLocaleString(undefined, {minimumFractionDigits: 2})}`;
                            actPoItems[0].special_notes += `\n\n${diffNote}`;
                        }

                        poItems.push(...actPoItems);
                    }

                    let discount = 0;
                    let serviceCharge = 0;
                    if (actualTotal < calculatedSubtotal) {
                        discount = calculatedSubtotal - actualTotal;
                    } else if (actualTotal > calculatedSubtotal) {
                        serviceCharge = actualTotal - calculatedSubtotal;
                    }

                    const poPayload = {
                        id: poId,
                        tour_id: tourId,
                        po_number: poNumber,
                        po_date: new Date().toISOString().split('T')[0],
                        vendor_type: 'hotel' as const,
                        vendor_name: hotelName,
                        hotel_id: hotelId,
                        vendor_address: allHotels.find((h: any) => h.id === hotelId)?.location_address || locationName,
                        vendor_phone: allHotels.find((h: any) => h.id === hotelId)?.reservation_agent_contact || undefined,
                        vendor_email: allHotels.find((h: any) => h.id === hotelId)?.reservation_email || undefined,
                        currency: 'USD' as const,
                        status: 'Draft' as const,
                        subtotal: calculatedSubtotal,
                        total_amount: actualTotal,
                        discount: discount,
                        tax: 0,
                        service_charge: serviceCharge,
                        advance_paid: 0,
                        balance_payable: actualTotal,
                        vendor_notes: guestDetails
                    };

                    await savePurchaseOrderAction(poPayload, poItems);
                }
            }

            // Filter for transport activities
            const transportActivities = activities.filter(a => 
                a.distance != null && a.distance !== '' &&
                a.transport_id &&
                a.contracted_price != null
            );

            if (transportActivities.length > 0) {
                // Group by transport_id AND vehicle_id
                const transportGroups = transportActivities.reduce((acc, a) => {
                    const groupKey = `${a.transport_id}_${a.vehicle_id || 'unassigned'}`;
                    if (!acc[groupKey]) acc[groupKey] = [];
                    acc[groupKey].push(a);
                    return acc;
                }, {} as Record<string, any[]>);

                for (const [groupKey, _transActs] of Object.entries(transportGroups)) {
                    const transportActs = _transActs as any[];
                    const poId = crypto.randomUUID();
                    const poNumber = `PO-TRN-${Date.now().toString().slice(-6)}`;
                    
                    const firstAct = transportActs[0];
                    const transportId = firstAct.transport_id;
                    const providerData = allTransportProviders.find((p: any) => p.id === transportId);
                    const vendorName = providerData ? providerData.name : 'Transport Provider';

                    let calculatedSubtotal = 0;
                    let actualTotal = 0;
                    const poItems: any[] = [];

                    for (const act of transportActs) {
                        const itemQty = act.quantity || 1;
                        const itemUnitPrice = act.contracted_price || 0;
                        const itemCalculatedTotal = itemQty * itemUnitPrice;

                        calculatedSubtotal += itemCalculatedTotal;
                        actualTotal += act.contracted_total_price != null 
                            ? Number(act.contracted_total_price) 
                            : (act.contracted_price || 0) * itemQty;
                        
                        let serviceDate = '';
                        if (tripData.profile?.arrivalDate) {
                            const matchingBlock = tripData.itinerary.find(b => b.id === act.id);
                            if (matchingBlock && matchingBlock.dayNumber) {
                                const dateObj = new Date(tripData.profile.arrivalDate);
                                dateObj.setDate(dateObj.getDate() + (matchingBlock.dayNumber - 1));
                                serviceDate = dateObj.toISOString().split('T')[0];
                            }
                        }

                        const distanceStr = act.distance ? ` (${act.distance})` : '';
                        const description = `${act.title || 'Transport Segment'}${distanceStr}`;

                        let specialNotes = '';
                        if (providerData && providerData.transport_vehicles && act.vehicle_id) {
                            const vehicleData = providerData.transport_vehicles.find((v: any) => v.id === act.vehicle_id);
                            if (vehicleData) {
                                const type = vehicleData.vehicle_type || '';
                                const brandModel = vehicleData.make_and_model || '';
                                const plate = vehicleData.vehicle_number ? `(Plate: ${vehicleData.vehicle_number})` : '';
                                specialNotes = `Assigned Vehicle: ${type} ${brandModel} ${plate}`.trim();
                            }
                        }

                        poItems.push({
                            id: crypto.randomUUID(),
                            purchase_order_id: poId,
                            daily_activity_id: act.id,
                            description: description,
                            service_date: serviceDate,
                            quantity: itemQty,
                            unit_price: itemUnitPrice,
                            total_price: itemCalculatedTotal,
                            vehicle_type: firstAct.vehicle_id || undefined,
                            special_notes: specialNotes || undefined
                        });
                    }

                    let discount = 0;
                    let serviceCharge = 0;
                    if (actualTotal < calculatedSubtotal) {
                        discount = calculatedSubtotal - actualTotal;
                    } else if (actualTotal > calculatedSubtotal) {
                        serviceCharge = actualTotal - calculatedSubtotal;
                    }

                    const poPayload = {
                        id: poId,
                        tour_id: tourId,
                        po_number: poNumber,
                        po_date: new Date().toISOString().split('T')[0],
                        vendor_type: 'transport' as const,
                        vendor_name: vendorName,
                        transport_provider_id: transportId,
                        vendor_address: providerData?.address || undefined,
                        vendor_phone: providerData?.phone || undefined,
                        vendor_email: providerData?.email || undefined,
                        currency: 'USD' as const,
                        status: 'Draft' as const,
                        subtotal: calculatedSubtotal,
                        total_amount: actualTotal,
                        discount: discount,
                        tax: 0,
                        service_charge: serviceCharge,
                        advance_paid: 0,
                        balance_payable: actualTotal,
                        vendor_notes: guestDetails
                    };

                    await savePurchaseOrderAction(poPayload, poItems);
                }
            }
            // Filter for restaurant activities
            const restaurantActivities = activities.filter(a => 
                a.restaurant_id &&
                a.contracted_price != null
            );

            if (restaurantActivities.length > 0) {
                // Group by restaurant_id
                const restaurantGroups = restaurantActivities.reduce((acc, a) => {
                    if (!acc[a.restaurant_id]) acc[a.restaurant_id] = [];
                    acc[a.restaurant_id].push(a);
                    return acc;
                }, {} as Record<string, any[]>);

                for (const [restaurantId, _restActs] of Object.entries(restaurantGroups)) {
                    const restaurantActs = _restActs as any[];
                    const poId = crypto.randomUUID();
                    const poNumber = `PO-RES-${Date.now().toString().slice(-6)}`;
                    
                    const firstAct = restaurantActs[0];
                    const providerData = allRestaurants.find((r: any) => r.id === restaurantId);
                    const vendorName = providerData ? providerData.name : firstAct.title || 'Restaurant';

                    let calculatedSubtotal = 0;
                    let actualTotal = 0;
                    const poItems: any[] = [];

                    for (const act of restaurantActs) {
                        const itemQty = act.quantity || 1;
                        const itemUnitPrice = act.contracted_price || 0;
                        const itemCalculatedTotal = itemQty * itemUnitPrice;

                        calculatedSubtotal += itemCalculatedTotal;
                        actualTotal += act.contracted_total_price != null 
                            ? Number(act.contracted_total_price) 
                            : (act.contracted_price || 0) * itemQty;
                        
                        let serviceDate = '';
                        if (tripData.profile?.arrivalDate) {
                            const matchingBlock = tripData.itinerary.find(b => b.id === act.id);
                            if (matchingBlock && matchingBlock.dayNumber) {
                                const dateObj = new Date(tripData.profile.arrivalDate);
                                dateObj.setDate(dateObj.getDate() + (matchingBlock.dayNumber - 1));
                                serviceDate = dateObj.toISOString().split('T')[0];
                            }
                        }

                        const mealPlanStr = act.meal_plan ? ` (${act.meal_plan})` : '';
                        const description = `${act.title || 'Meal'}${mealPlanStr}`;

                        let specialNotes = `Location: ${act.location_name || providerData?.city || 'Unknown'}`;
                        if (act.driver_meal_included) {
                            specialNotes += `\nDriver Meal Included: Yes`;
                        }

                        poItems.push({
                            id: crypto.randomUUID(),
                            purchase_order_id: poId,
                            daily_activity_id: act.id,
                            description: description,
                            service_date: serviceDate,
                            quantity: itemQty,
                            unit_price: itemUnitPrice,
                            total_price: itemCalculatedTotal,
                            meal_plan: act.meal_plan || undefined,
                            special_notes: specialNotes
                        });
                    }

                    let discount = 0;
                    let serviceCharge = 0;
                    if (actualTotal < calculatedSubtotal) {
                        discount = calculatedSubtotal - actualTotal;
                    } else if (actualTotal > calculatedSubtotal) {
                        serviceCharge = actualTotal - calculatedSubtotal;
                    }

                    const poPayload = {
                        id: poId,
                        tour_id: tourId,
                        po_number: poNumber,
                        po_date: new Date().toISOString().split('T')[0],
                        vendor_type: 'restaurant' as const,
                        vendor_name: vendorName,
                        vendor_address: providerData?.address || undefined,
                        vendor_phone: providerData?.contact_number || undefined,
                        vendor_email: providerData?.email || undefined,
                        currency: 'USD' as const,
                        status: 'Draft' as const,
                        subtotal: calculatedSubtotal,
                        total_amount: actualTotal,
                        discount: discount,
                        tax: 0,
                        service_charge: serviceCharge,
                        advance_paid: 0,
                        balance_payable: actualTotal,
                        vendor_notes: guestDetails
                    };

                    await savePurchaseOrderAction(poPayload, poItems);
                }
            }
            // Filter for vendor activities (Tour / Activity Vendors)
            const vendorActivities = activities.filter(a => 
                a.activity_id &&
                a.vendor_id && 
                a.vendor_activity_id &&
                a.contracted_price != null
            );

            if (vendorActivities.length > 0) {
                // Group by vendor_id
                const vendorGroups = vendorActivities.reduce((acc, a) => {
                    if (!acc[a.vendor_id]) acc[a.vendor_id] = [];
                    acc[a.vendor_id].push(a);
                    return acc;
                }, {} as Record<string, any[]>);

                for (const [vendorId, _vendActs] of Object.entries(vendorGroups)) {
                    const vendActs = _vendActs as any[];
                    const poId = crypto.randomUUID();
                    const poNumber = `PO-ACT-${Date.now().toString().slice(-6)}`;
                    
                    const firstAct = vendActs[0];
                    const providerData = allVendors.find((v: any) => v.id === vendorId);
                    const vendorName = providerData ? providerData.name : firstAct.title || 'Activity Vendor';

                    let calculatedSubtotal = 0;
                    let actualTotal = 0;
                    const poItems: any[] = [];

                    for (const act of vendActs) {
                        const itemQty = act.quantity || 1;
                        const itemUnitPrice = act.contracted_price || 0;
                        const itemCalculatedTotal = itemQty * itemUnitPrice;

                        calculatedSubtotal += itemCalculatedTotal;
                        actualTotal += act.contracted_total_price != null 
                            ? Number(act.contracted_total_price) 
                            : (act.contracted_price || 0) * itemQty;
                        
                        let serviceDate = '';
                        if (tripData.profile?.arrivalDate) {
                            const matchingBlock = tripData.itinerary.find(b => b.id === act.id);
                            if (matchingBlock && matchingBlock.dayNumber) {
                                const dateObj = new Date(tripData.profile.arrivalDate);
                                dateObj.setDate(dateObj.getDate() + (matchingBlock.dayNumber - 1));
                                serviceDate = dateObj.toISOString().split('T')[0];
                            }
                        }

                        const description = act.title || 'Activity Segment';
                        let specialNotes = `Location: ${act.location_name || 'Not Specified'}`;

                        poItems.push({
                            id: crypto.randomUUID(),
                            purchase_order_id: poId,
                            daily_activity_id: act.id,
                            description: description,
                            service_date: serviceDate,
                            quantity: itemQty,
                            unit_price: itemUnitPrice,
                            total_price: itemCalculatedTotal,
                            special_notes: specialNotes
                        });
                    }

                    let discount = 0;
                    let serviceCharge = 0;
                    if (actualTotal < calculatedSubtotal) {
                        discount = calculatedSubtotal - actualTotal;
                    } else if (actualTotal > calculatedSubtotal) {
                        serviceCharge = actualTotal - calculatedSubtotal;
                    }

                    const poPayload = {
                        id: poId,
                        tour_id: tourId,
                        po_number: poNumber,
                        po_date: new Date().toISOString().split('T')[0],
                        vendor_type: 'vendor' as const,
                        vendor_name: vendorName,
                        activity_vendor_id: vendorId,
                        vendor_address: providerData?.address || undefined,
                        vendor_phone: providerData?.phone || undefined,
                        vendor_email: providerData?.email || undefined,
                        currency: 'USD' as const,
                        status: 'Draft' as const,
                        subtotal: calculatedSubtotal,
                        total_amount: actualTotal,
                        discount: discount,
                        tax: 0,
                        service_charge: serviceCharge,
                        advance_paid: 0,
                        balance_payable: actualTotal,
                        vendor_notes: guestDetails
                    };

                    await savePurchaseOrderAction(poPayload, poItems);
                }
            }


            alert(`Generated POs successfully for finalized items.`);
            await fetchPurchaseOrders();
        } catch (error) {
            console.error("Error syncing with itinerary:", error);
            alert("An error occurred while syncing with the itinerary.");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-serif text-brand-green flex items-center gap-2">
                        <Calculator className="text-brand-gold" /> Finance & Supplier Control
                    </h3>
                    <p className="text-sm text-neutral-500 mt-1">Manage vendor payments, reconcile POs, and verify supplier invoices.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={syncWithItinerary}
                        disabled={isSyncing}
                        className="flex items-center gap-2 bg-brand-gold text-white px-5 py-2.5 rounded-2xl hover:bg-yellow-600 transition-all shadow-lg shadow-yellow-200/50 font-bold text-sm disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} /> {isSyncing ? 'Syncing...' : 'Sync with Itinerary'}
                    </button>
                </div>
            </div>

            {isLoadingPOs ? (
                <div className="bg-white p-12 rounded-[40px] border border-neutral-200 shadow-sm text-center">
                    <RefreshCw className="animate-spin mx-auto text-neutral-300 mb-2" />
                    <p className="text-neutral-400 italic">Loading Purchase Orders...</p>
                </div>
            ) : purchaseOrders.length === 0 ? (
                <div className="bg-white p-12 rounded-[40px] border border-neutral-200 shadow-sm text-center">
                    <p className="text-neutral-400 italic">No Purchase Orders generated yet. Click "Sync with Itinerary" to generate them.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {purchaseOrders.map((po) => (
                        <div key={po.id} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                            <div 
                                className="px-6 py-4 flex items-center justify-between cursor-pointer bg-neutral-50 hover:bg-neutral-100 transition-colors"
                                onClick={() => setExpandedPO(expandedPO === po.id ? null : po.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl ${po.vendor_type === 'hotel' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-neutral-800">{po.vendor_name}</h4>
                                        <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                                            <span className="font-mono bg-neutral-200 px-2 py-0.5 rounded-md">{po.po_number}</span>
                                            <span>•</span>
                                            <span className="capitalize">{po.vendor_type}</span>
                                            <span>•</span>
                                            <span>{new Date(po.po_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-neutral-800">${(po.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        <div className={`text-xs font-bold mt-1 ${po.status === 'Draft' ? 'text-amber-500' : 'text-green-500'}`}>
                                            {po.status}
                                        </div>
                                    </div>
                                    <div className="text-neutral-400">
                                        {expandedPO === po.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>
                            </div>
                            
                            {expandedPO === po.id && po.items && po.items.length > 0 && (
                                <div className="px-6 py-4 border-t border-neutral-100">
                                    {(po.vendor_address || po.vendor_phone || po.vendor_email || po.sent_email || po.sent_to_name || po.sent_date) && (
                                        <div className="mb-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-xs text-neutral-600 space-y-1">
                                            {po.vendor_address && <div><span className="font-semibold">Address:</span> {po.vendor_address}</div>}
                                            {po.vendor_phone && <div><span className="font-semibold">Phone:</span> {po.vendor_phone}</div>}
                                            {po.vendor_email && <div><span className="font-semibold">Registered Email:</span> {po.vendor_email}</div>}
                                            {(po.sent_email || po.sent_to_name || po.sent_date) && (
                                                <div className="pt-2 mt-2 border-t border-neutral-200/60 text-neutral-500">
                                                    <div className="font-semibold text-neutral-700 mb-1">Email Delivery Tracking:</div>
                                                    {po.sent_to_name && <div><span className="font-semibold">Sent To Name:</span> {po.sent_to_name}</div>}
                                                    {po.sent_email && <div><span className="font-semibold">Sent To Email:</span> {po.sent_email}</div>}
                                                    {po.sent_date && <div><span className="font-semibold">Sent Date:</span> {new Date(po.sent_date).toLocaleString()}</div>}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-neutral-400 border-b border-neutral-100">
                                                    <th className="pb-2 font-medium">Description</th>
                                                    <th className="pb-2 font-medium">Service Date</th>
                                                    <th className="pb-2 font-medium text-center">Qty</th>
                                                    <th className="pb-2 font-medium text-right">Unit Price</th>
                                                    <th className="pb-2 font-medium text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-50">
                                                {[...po.items].sort((a: any, b: any) => {
                                                    if (!a.service_date) return 1;
                                                    if (!b.service_date) return -1;
                                                    return new Date(a.service_date).getTime() - new Date(b.service_date).getTime();
                                                }).map((item: any) => (
                                                    <tr key={item.id} className="text-neutral-700">
                                                        <td className="py-3">
                                                            <div className="font-medium">{item.description}</div>
                                                            {item.special_notes && (
                                                                <div className="text-xs text-orange-500 mt-1 whitespace-pre-line">{item.special_notes}</div>
                                                            )}
                                                        </td>
                                                        <td className="py-3">{item.service_date ? new Date(item.service_date).toLocaleDateString() : '-'}</td>
                                                        <td className="py-3 text-center">{item.quantity}</td>
                                                        <td className="py-3 text-right">${(item.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                        <td className="py-3 text-right font-bold">${(item.total_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="border-t border-neutral-200 text-neutral-700">
                                                {po.discount > 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="py-2 text-right text-green-600 font-medium">Discount</td>
                                                        <td className="py-2 text-right text-green-600 font-bold">-${(po.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    </tr>
                                                )}
                                                {po.service_charge > 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="py-2 text-right text-orange-600 font-medium">Markup / Service Charge</td>
                                                        <td className="py-2 text-right text-orange-600 font-bold">+${(po.service_charge || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    </tr>
                                                )}
                                                <tr>
                                                    <td colSpan={4} className="py-3 text-right text-neutral-800 font-bold text-base">Total Amount</td>
                                                    <td className="py-3 text-right text-neutral-800 font-black text-base">${(po.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                    
                                    {po.vendor_notes && (
                                        <div className="mt-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-xs text-neutral-600 whitespace-pre-line">
                                            <span className="font-bold text-neutral-800 block mb-1">Vendor Notes / Guest Details:</span>
                                            {po.vendor_notes}
                                        </div>
                                    )}

                                    <div className="mt-6 pt-6 border-t border-neutral-100 flex justify-end">
                                        <button
                                            onClick={() => handleOpenSendModal(po)}
                                            className="flex items-center gap-2 bg-brand-charcoal text-white hover:bg-black px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md"
                                        >
                                            <Mail size={14} className="text-brand-gold" />
                                            Send PO via Email
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showSendModal && selectedPO && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] border border-neutral-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="bg-brand-charcoal p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Mail className="text-brand-gold" size={24} />
                                <div>
                                    <h3 className="text-lg font-bold font-serif">Email Purchase Order</h3>
                                    <p className="text-xs text-neutral-400">Send PO {selectedPO.po_number} as PDF to {selectedPO.vendor_name}</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setShowSendModal(false)} className="text-neutral-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSendPO} className="p-8 space-y-6">
                            {emailMessage && (
                                <div className={`p-4 rounded-xl flex items-center gap-3 border ${
                                    emailMessage.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                                }`}>
                                    {emailMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                    <p className="text-sm font-medium">{emailMessage.text}</p>
                                </div>
                            )}

                            {/* Template dropdown */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                                    <LayoutTemplate size={12} className="text-brand-gold" /> Email Template
                                </label>
                                <select
                                    value={selectedTemplateId}
                                    onChange={handleTemplateChange}
                                    className="w-full bg-neutral-50 border border-neutral-200 text-brand-charcoal rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all"
                                >
                                    <option value="">-- Start from scratch / Default template --</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* From */}
                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                                        <User size={12} className="text-brand-gold" /> From (Sender)
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={emailFrom}
                                        onChange={(e) => setEmailFrom(e.target.value)}
                                        className="w-full bg-neutral-50 border border-neutral-200 text-brand-charcoal rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all"
                                    />
                                </div>

                                {/* Recipient Name */}
                                <div className="space-y-2 col-span-2 md:col-span-1">
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                                        <User size={12} className="text-brand-gold" /> Recipient Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={emailToName}
                                        onChange={(e) => setEmailToName(e.target.value)}
                                        placeholder="Recipient Name"
                                        className="w-full bg-neutral-50 border border-neutral-200 text-brand-charcoal rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all"
                                    />
                                </div>

                                {/* To */}
                                <div className="space-y-2 col-span-2 md:col-span-1">
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                                        <Mail size={12} className="text-brand-gold" /> Recipient Email
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={emailTo}
                                        onChange={(e) => setEmailTo(e.target.value)}
                                        placeholder="vendor@example.com"
                                        className="w-full bg-neutral-50 border border-neutral-200 text-brand-charcoal rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Subject */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                                    <Type size={12} className="text-brand-gold" /> Subject
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    className="w-full bg-neutral-50 border border-neutral-200 text-brand-charcoal rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all"
                                />
                            </div>

                            {/* Message Body */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                                    <MessageSquare size={12} className="text-brand-gold" /> Message Body
                                </label>
                                <div
                                    ref={editorRef}
                                    contentEditable
                                    onInput={() => {
                                        if (editorRef.current) {
                                            setEmailBody(editorRef.current.innerHTML);
                                        }
                                    }}
                                    onBlur={() => {
                                        if (editorRef.current) {
                                            setEmailBody(editorRef.current.innerHTML);
                                        }
                                    }}
                                    className="w-full bg-neutral-50 border border-neutral-200 text-brand-charcoal rounded-xl p-4 min-h-[150px] max-h-[250px] overflow-y-auto focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all prose prose-sm max-w-none text-sm"
                                />
                            </div>

                            {/* Attachment info */}
                            <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-100 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 text-neutral-600">
                                    <FileText size={16} className="text-brand-gold" />
                                    <span className="font-semibold">{selectedPO.po_number}.pdf</span>
                                    <span className="text-neutral-400">(Purchase Order document attachment)</span>
                                </div>
                                <span className="bg-brand-gold/15 text-brand-gold px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[10px]">
                                    Auto-Generated
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="pt-4 border-t border-neutral-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowSendModal(false)}
                                    className="px-6 py-2.5 rounded-xl border border-neutral-200 text-neutral-500 hover:bg-neutral-50 font-bold text-sm transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSendingEmail}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm text-white ${
                                        isSendingEmail
                                        ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                                        : 'bg-brand-charcoal hover:bg-black shadow-lg hover:shadow-xl'
                                    }`}
                                >
                                    {isSendingEmail ? (
                                        <>
                                            <RefreshCw className="animate-spin text-neutral-400" size={16} />
                                            Sending PO...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={16} className="text-brand-gold" />
                                            Send Email
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
