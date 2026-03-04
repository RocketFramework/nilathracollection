"use client";

import { TripData, DBPurchaseOrder, DBPurchaseOrderItem, DBVendorInvoice, Financials, POStatus } from "../types";
import { Calculator, Receipt, Send, CheckCircle2, AlertTriangle, RefreshCw, Plus, FileText, ChevronRight, Check, X, ShieldCheck, Trash2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    getHotelsListAction,
    getVendorsAction,
    getTransportProvidersAction,
    getTourGuidesAction,
    getRestaurantsAction,
    saveTourAction,
    getPurchaseOrdersAction,
    savePurchaseOrderAction,
    deletePurchaseOrderAction,
    saveVendorInvoiceAction,
    saveVendorPaymentAction,
    getExchangeRateAction
} from "@/actions/admin.actions";

export function FinanceAndBookingStep({
    tripData,
    updateFinancials
}: {
    tripData: TripData,
    updateFinancials: (f: Financials) => void
}) {

    const [activePOId, setActivePOId] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [dbPOs, setDbPOs] = useState<DBPurchaseOrder[]>([]);
    const [isLoadingPOs, setIsLoadingPOs] = useState(false);
    const [exchangeRate, setExchangeRate] = useState(300);
    const [isLoadingRate, setIsLoadingRate] = useState(false);
    const [previewPO, setPreviewPO] = useState<DBPurchaseOrder | null>(null);

    const tourId = tripData.id;

    const loadPOs = async () => {
        if (!tourId) {
            console.warn("loadPOs called but tourId is missing", { tripDataId: tripData.id });
            return;
        }
        setIsLoadingPOs(true);
        try {
            console.log("Fetching POs for tourId:", tourId);
            const res = await getPurchaseOrdersAction(tourId);
            if (res.success && res.pos) {
                console.log("Successfully loaded POs:", res.pos.length);
                setDbPOs(res.pos);
            } else if (res.error) {
                console.error("Server action failed to load POs:", res.error);
            }
        } catch (error) {
            console.error("Failed to load POs", error);
        } finally {
            setIsLoadingPOs(false);
        }
    };

    useEffect(() => {
        loadPOs();
        const fetchRate = async () => {
            setIsLoadingRate(true);
            try {
                const res = await getExchangeRateAction();
                if (res.success && res.rate) {
                    setExchangeRate(res.rate);
                }
            } catch (err) {
                console.error("Failed to fetch exchange rate", err);
            } finally {
                setIsLoadingRate(false);
            }
        };
        fetchRate();
    }, [tourId]);

    // AGGREGATION ENGINE: Scans trip data to build recommended POs
    const syncWithItinerary = async () => {
        if (!tourId) {
            alert("Tour must be saved before generating POs.");
            return;
        }
        setIsSyncing(true);
        try {
            // 0. Automatically save the workflow first to ensure itinerary blocks exist in DB with stable IDs
            const saveRes = await saveTourAction(tourId, tripData);
            if (!saveRes.success) {
                throw new Error("Failed to save itinerary before sync: " + saveRes.error);
            }

            const [hotelsRes, vendorsRes, transportsRes, guidesRes, restRes] = await Promise.all([
                getHotelsListAction(),
                getVendorsAction(),
                getTransportProvidersAction(),
                getTourGuidesAction(),
                getRestaurantsAction()
            ]);

            const hotels = hotelsRes.success ? (hotelsRes.hotels || []) : [];
            const vendors = vendorsRes.success ? (vendorsRes.vendors || []) : [];
            const transports = transportsRes.success ? (transportsRes.providers || []) : [];
            const guides = guidesRes.success ? (guidesRes.guides || []) : [];
            const restaurants = restRes.success ? (restRes.restaurants || []) : [];

            // Identify blocks that are already in a confirmed/sent PO to avoid duplicate generated items
            const preservedLinkedBlockIds = new Set<string>();
            dbPOs.forEach(po => {
                if (po.status !== 'Draft' && po.status !== 'Pending Confirmation') {
                    po.items?.forEach(item => {
                        if (item.tour_itinerary_id) {
                            preservedLinkedBlockIds.add(item.tour_itinerary_id);
                        }
                    });
                }
            });

            // Map existing POs by their vendor reference to allow reuse (Drafts only)
            const existingPOByVendor = new Map<string, string>(); // vendorRef string -> PO ID
            dbPOs.forEach(po => {
                if (po.status === 'Draft' || po.status === 'Pending Confirmation') {
                    const key = po.hotel_id || po.activity_vendor_id || po.transport_provider_id || po.guide_id || po.restaurant_id;
                    if (key) existingPOByVendor.set(key, po.id);
                }
            });

            const newPOs: Partial<DBPurchaseOrder>[] = [];
            const dayServiceMap = new Map<number, Set<string>>();

            // We process EVERYTHING from Itinerary now, grouping by vendorId or generic type
            const vendorMap = new Map<string, {
                name: string,
                type: DBPurchaseOrder['vendor_type'],
                address?: string,
                phone?: string,
                email?: string,
                vendorRef: { hotel_id?: string, activity_vendor_id?: string, transport_provider_id?: string, guide_id?: string, restaurant_id?: string },
                items: Partial<DBPurchaseOrderItem>[]
            }>();

            tripData.itinerary.forEach(block => {
                if (preservedLinkedBlockIds.has(block.id)) return; // Skip items already in a confirmed or sent PO

                const totalPax = (tripData.profile.adults || 0) + (tripData.profile.children || 0);

                let vendorId = '';
                let vendorName = '';
                let vendorType: DBPurchaseOrder['vendor_type'] = 'other';
                let vendorAddress = '';
                let vendorPhone = '';
                let vendorEmail = '';
                let vendorRef: any = {};

                let price = block.agreedPrice || 0;
                let qty = 1;
                let roomConfig = '';
                let mlPlan = '';
                let vhType = '';

                if (block.type === 'sleep' && block.hotelId) {
                    const hotel = hotels.find((h: any) => h.id === block.hotelId);
                    vendorId = block.hotelId;
                    vendorRef = { hotel_id: block.hotelId };
                    vendorName = hotel ? hotel.name : (block.name || 'Selected Hotel');
                    vendorAddress = hotel?.location_address || '';
                    vendorPhone = hotel?.reservation_agent_contact || hotel?.gm_contact || '';
                    vendorEmail = hotel?.sales_agent_name || '';
                    vendorType = 'hotel';
                    const acc = tripData.accommodations?.find(a => a.nightIndex === block.dayNumber && (a.hotelId === block.hotelId || a.hotelName === hotel?.name));
                    roomConfig = acc?.beddingConfiguration || acc?.roomStandard || 'Standard Room';
                    mlPlan = acc?.mealPlan || 'BB';
                    price = acc?.pricePerNight || 0;
                    qty = acc?.numberOfRooms || 1;

                    // Smart Room Count: If totalPax is high and user hasn't explicitly set more rooms, 
                    // calculate based on capacity (Double=2, Triple=3, Single=1)
                    if (totalPax > 1 && qty <= 1) {
                        let capacity = 2; // Default to Double/Twin
                        const cfg = roomConfig.toLowerCase();
                        if (cfg.includes('triple')) capacity = 3;
                        else if (cfg.includes('single')) capacity = 1;
                        else if (cfg.includes('quad')) capacity = 4;

                        const suggestedRooms = Math.ceil(totalPax / capacity);
                        if (suggestedRooms > qty) {
                            qty = suggestedRooms;
                        }
                    }
                } else if (block.type === 'activity' && (block.vendorId || block.vendorActivityId)) {
                    const vendor = vendors.find((v: any) => v.id === block.vendorId);
                    vendorId = block.vendorId || '';
                    vendorRef = { activity_vendor_id: block.vendorId };
                    vendorName = vendor ? vendor.name : (block.serviceProvider || block.name);
                    vendorAddress = vendor?.address || '';
                    vendorPhone = vendor?.phone || '';
                    vendorEmail = vendor?.email || '';
                    vendorType = 'vendor';
                    qty = totalPax;
                    price = block.agreedPrice || 0;

                    // If we have a guide assigned to an activity, track it
                    if (block.guideId || tripData.defaultGuideId) {
                        if (!dayServiceMap.has(block.dayNumber)) dayServiceMap.set(block.dayNumber, new Set());
                        dayServiceMap.get(block.dayNumber)!.add('guide');
                    }
                } else if (block.type === 'travel') {
                    const effectiveTransportId = block.transportId || tripData.defaultTransportId;
                    if (effectiveTransportId) {
                        const provider = transports.find((t: any) => t.id === effectiveTransportId);
                        vendorId = effectiveTransportId;
                        vendorRef = { transport_provider_id: effectiveTransportId };
                        vendorName = provider ? provider.name : (block.serviceProvider || 'Transport Provider');
                        vendorAddress = provider?.address || '';
                        vendorPhone = provider?.phone || '';
                        vendorEmail = provider?.email || '';
                        vendorType = 'transport';

                        const effectiveVehicleId = block.vehicleId || tripData.defaultVehicleId;
                        const vehicleMatch = provider?.transport_vehicles?.find((v: any) => v.id === effectiveVehicleId);
                        vhType = vehicleMatch ? (vehicleMatch.make_and_model || vehicleMatch.vehicle_type) : (tripData.transports?.[0]?.mode || 'Standard Vehicle');
                        price = vehicleMatch?.day_rate || 0;

                        if (!dayServiceMap.has(block.dayNumber)) dayServiceMap.set(block.dayNumber, new Set());
                        dayServiceMap.get(block.dayNumber)!.add('transport');
                    }
                } else if (block.type === 'guide') {
                    const effectiveGuideId = block.guideId || tripData.defaultGuideId;
                    if (effectiveGuideId) {
                        const guide = guides.find((g: any) => g.id === effectiveGuideId);
                        vendorId = effectiveGuideId;
                        vendorRef = { guide_id: effectiveGuideId };
                        vendorName = guide ? `${guide.first_name} ${guide.last_name || ''}`.trim() : (block.serviceProvider || block.name);
                        vendorPhone = guide?.phone || '';
                        vendorType = 'guide';
                        price = guide?.per_day_rate || 0;

                        if (!dayServiceMap.has(block.dayNumber)) dayServiceMap.set(block.dayNumber, new Set());
                        dayServiceMap.get(block.dayNumber)!.add('guide');
                    }
                } else if (block.type === 'meal' && block.restaurantId) {
                    const rest = restaurants.find((r: any) => r.id === block.restaurantId);
                    vendorId = block.restaurantId;
                    vendorRef = { restaurant_id: block.restaurantId };
                    vendorName = rest ? rest.name : (block.serviceProvider || block.name);
                    vendorAddress = rest?.address || '';

                    // Use the specifically selected meal price, or fallback to lunch rate
                    price = block.agreedPrice || rest?.lunch_rate_per_head || 0;
                    qty = totalPax;

                    vendorPhone = rest?.contact_number || '';
                    vendorEmail = rest?.email || '';
                    vendorType = 'vendor';
                }

                if (!vendorId) return;

                let calculatedDate = '';
                if (tripData.profile.arrivalDate) {
                    const dateObj = new Date(tripData.profile.arrivalDate);
                    dateObj.setDate(dateObj.getDate() + (block.dayNumber - 1));
                    calculatedDate = dateObj.toISOString().split('T')[0];
                }

                const item: Partial<DBPurchaseOrderItem> = {
                    id: crypto.randomUUID(),
                    description: block.mealType ? `${block.name} - ${block.mealType}` : block.name,
                    service_date: calculatedDate, // Must be YYYY-MM-DD
                    quantity: qty,
                    total_price: (price * exchangeRate) * qty,
                    tour_itinerary_id: block.id,
                    day_number: block.dayNumber,
                    room_type: roomConfig,
                    meal_plan: mlPlan,
                    unit_price: price * exchangeRate,
                    vehicle_type: vhType,
                    number_of_guests: totalPax
                };

                // Add hotel specific dates if applicable
                if (block.type === 'sleep' && calculatedDate) {
                    item.check_in_date = calculatedDate;
                    const outDate = new Date(calculatedDate);
                    outDate.setDate(outDate.getDate() + 1);
                    item.check_out_date = outDate.toISOString().split('T')[0];
                    item.number_of_nights = 1;
                }

                if (!vendorMap.has(vendorId)) {
                    vendorMap.set(vendorId, {
                        name: vendorName,
                        type: vendorType,
                        address: vendorAddress,
                        phone: vendorPhone,
                        email: vendorEmail,
                        vendorRef,
                        items: []
                    });
                }
                vendorMap.get(vendorId)!.items.push(item);
            });

            // 2. Global Assignment Injector: Catch days where no blocks triggered a PO for global services
            for (let day = 1; day <= (tripData.profile.durationDays || 1); day++) {
                const totalPax = (tripData.profile.adults || 0) + (tripData.profile.children || 0);

                let calculatedDate = '';
                if (tripData.profile.arrivalDate) {
                    const dateObj = new Date(tripData.profile.arrivalDate);
                    dateObj.setDate(dateObj.getDate() + (day - 1));
                    calculatedDate = dateObj.toISOString().split('T')[0];
                }

                // Global Guide Synthesis
                if (tripData.defaultGuideId && !dayServiceMap.get(day)?.has('guide')) {
                    const guide = guides.find((g: any) => g.id === tripData.defaultGuideId);
                    if (guide) {
                        const price = guide.per_day_rate || 0;
                        const item: Partial<DBPurchaseOrderItem> = {
                            id: crypto.randomUUID(),
                            description: `Guide Service - Day ${day}`,
                            service_date: calculatedDate,
                            quantity: 1,
                            unit_price: price * exchangeRate,
                            total_price: price * exchangeRate,
                            day_number: day,
                            number_of_guests: totalPax
                        };

                        if (!vendorMap.has(tripData.defaultGuideId)) {
                            vendorMap.set(tripData.defaultGuideId, {
                                name: `${guide.first_name} ${guide.last_name || ''}`.trim(),
                                type: 'guide',
                                phone: guide.phone || '',
                                vendorRef: { guide_id: tripData.defaultGuideId },
                                items: []
                            });
                        }
                        vendorMap.get(tripData.defaultGuideId)!.items.push(item);
                    }
                }

                // Global Transport Synthesis
                if (tripData.defaultTransportId && !dayServiceMap.get(day)?.has('transport')) {
                    const provider = transports.find((t: any) => t.id === tripData.defaultTransportId);
                    if (provider) {
                        const effectiveVehicleId = tripData.defaultVehicleId;
                        const vehicleMatch = provider.transport_vehicles?.find((v: any) => v.id === effectiveVehicleId);
                        const price = vehicleMatch?.day_rate || 0;
                        const item: Partial<DBPurchaseOrderItem> = {
                            id: crypto.randomUUID(),
                            description: `Transport Service - Day ${day}`,
                            service_date: calculatedDate,
                            quantity: 1,
                            unit_price: price * exchangeRate,
                            total_price: price * exchangeRate,
                            day_number: day,
                            vehicle_type: vehicleMatch ? (vehicleMatch.make_and_model || vehicleMatch.vehicle_type) : 'Standard Vehicle',
                            number_of_guests: totalPax
                        };

                        if (!vendorMap.has(tripData.defaultTransportId)) {
                            vendorMap.set(tripData.defaultTransportId, {
                                name: provider.name,
                                type: 'transport',
                                address: provider.address || '',
                                phone: provider.phone || '',
                                email: provider.email || '',
                                vendorRef: { transport_provider_id: tripData.defaultTransportId },
                                items: []
                            });
                        }
                        vendorMap.get(tripData.defaultTransportId)!.items.push(item);
                    }
                }
            }

            const syncPromises: Promise<any>[] = [];

            vendorMap.forEach((data, vendorId) => {
                const total = data.items.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);
                const existingId = existingPOByVendor.get(vendorId);

                const poData: Partial<DBPurchaseOrder> = {
                    id: existingId, // Reuse existing ID if found
                    tour_id: tourId,
                    vendor_type: data.type,
                    vendor_name: data.name,
                    vendor_address: data.address,
                    vendor_phone: data.phone,
                    vendor_email: data.email,
                    currency: 'LKR',
                    po_date: new Date().toISOString().split('T')[0],
                    status: existingId ? undefined : 'Draft', // Don't overwrite status if updating
                    subtotal: total,
                    total_amount: total,
                    internal_notes: `Synced from Itinerary on ${new Date().toLocaleDateString()}`,
                    ...data.vendorRef
                };
                syncPromises.push(savePurchaseOrderAction(poData, data.items));
            });

            const results = await Promise.all(syncPromises);
            const errors = results.filter(r => r.error);

            if (errors.length > 0) {
                console.error("Some POs failed to save:", errors);
                alert(`Sync failed for ${errors.length} vendors. Error: ${errors[0].error}`);
            } else {
                await loadPOs();
                alert("Sync complete. Purchase Orders generated in DB.");
            }

        } catch (error) {
            console.error("Failed to sync with itinerary", error);
            alert("An error occurred while fetching supplier details for the Purchase Orders.");
        } finally {
            setIsSyncing(false);
        }
    };

    const updatePOStatus = async (po: DBPurchaseOrder, newStatus: POStatus) => {
        try {
            await savePurchaseOrderAction({ ...po, status: newStatus }, po.items || []);
            await loadPOs();
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const deletePO = async (id: string) => {
        if (!confirm("Delete this PO permanently?")) return;
        try {
            await deletePurchaseOrderAction(id);
            await loadPOs();
            if (activePOId === id) setActivePOId(null);
        } catch (error) {
            console.error("Failed to delete PO", error);
        }
    };

    const addPOItem = async (po: DBPurchaseOrder) => {
        const newItem: Partial<DBPurchaseOrderItem> = {
            id: crypto.randomUUID(),
            description: 'New Service Item',
            unit_price: 0,
            quantity: 1,
            total_price: 0
        };
        const updatedItems = [...(po.items || []), newItem];
        const newTotal = updatedItems.reduce((sum, i: any) => sum + (i.total_price || 0), 0);
        await savePurchaseOrderAction({ ...po, total_amount: newTotal, subtotal: newTotal }, updatedItems as DBPurchaseOrderItem[]);
        await loadPOs();
    };

    const deletePOItem = async (po: DBPurchaseOrder, itemId: string) => {
        const updatedItems = (po.items || []).filter(item => item.id !== itemId);
        const newTotal = updatedItems.reduce((sum, i) => sum + i.total_price, 0);
        await savePurchaseOrderAction({ ...po, total_amount: newTotal, subtotal: newTotal }, updatedItems);
        await loadPOs();
    };

    const updatePOItem = async (po: DBPurchaseOrder, itemId: string, updates: Partial<DBPurchaseOrderItem>) => {
        const updatedItems = (po.items || []).map(item => {
            if (item.id === itemId) {
                const refreshed = { ...item, ...updates };
                refreshed.total_price = (refreshed.unit_price || 0) * (refreshed.quantity || 1);
                return refreshed;
            }
            return item;
        });
        const newTotal = updatedItems.reduce((sum, i) => sum + i.total_price, 0);
        await savePurchaseOrderAction({ ...po, total_amount: newTotal, subtotal: newTotal }, updatedItems);
        await loadPOs();
    };

    const activePO = useMemo(() => dbPOs.find(po => po.id === activePOId), [dbPOs, activePOId]);
    const summaryData = useMemo(() => {
        const totalSent = dbPOs.filter(p => p.status !== 'Draft' && p.status !== 'Pending Confirmation').reduce((sum, p) => sum + p.total_amount, 0);
        const totalPending = dbPOs.filter(p => p.status === 'Draft' || p.status === 'Pending Confirmation').reduce((sum, p) => sum + p.total_amount, 0);
        return { totalSent, totalPending, count: dbPOs.length };
    }, [dbPOs]);

    const generateInvoice = async (po: DBPurchaseOrder) => {
        // Check if invoice already exists
        if (po.invoices && po.invoices.length > 0) {
            alert("A supplier invoice already exists for this PO.");
            return;
        }

        const newInvoice: Partial<DBVendorInvoice> = {
            purchase_order_id: po.id,
            invoice_number: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
            amount: po.total_amount,
            status: 'Pending',
            invoice_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days later
        };

        try {
            await saveVendorInvoiceAction(newInvoice);
            await loadPOs();
        } catch (error) {
            console.error("Failed to generate invoice", error);
        }
    };

    const updateInvoiceStatus = async (invoice: DBVendorInvoice, newStatus: DBVendorInvoice['status']) => {
        try {
            await saveVendorInvoiceAction({ ...invoice, status: newStatus });
            await loadPOs();
        } catch (error) {
            console.error("Failed to update invoice status", error);
        }
    };

    const totalInternalCost = useMemo(() => {
        return dbPOs.reduce((sum, po) => sum + po.total_amount, 0);
    }, [dbPOs]);

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
                    <div className="flex flex-col items-end">
                        <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-tight">Exchange Rate (USD → LKR)</label>
                        <div className="flex items-center gap-2">
                            {isLoadingRate && <RefreshCw size={12} className="animate-spin text-brand-gold" />}
                            <input
                                type="number"
                                value={exchangeRate}
                                onChange={(e) => setExchangeRate(Number(e.target.value))}
                                className="w-20 text-right bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 text-sm font-bold focus:ring-1 focus:ring-brand-gold outline-none"
                            />
                        </div>
                    </div>
                    <button
                        onClick={syncWithItinerary}
                        disabled={isSyncing}
                        className="flex items-center gap-2 bg-brand-gold text-white px-5 py-2.5 rounded-2xl hover:bg-yellow-600 transition-all shadow-lg shadow-yellow-200/50 font-bold text-sm disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} /> {isSyncing ? 'Syncing...' : 'Sync with Itinerary'}
                    </button>
                </div>
            </div>

            {/* Financial Summary Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-[32px] border border-neutral-100 shadow-sm">
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-1">Total Commitments</p>
                    <p className="text-2xl font-bold text-neutral-800">Rs. {totalInternalCost.toLocaleString()}</p>
                </div>
                <div className="bg-white p-5 rounded-[32px] border border-neutral-100 shadow-sm">
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-1">POs Issued</p>
                    <p className="text-2xl font-bold text-brand-gold">{dbPOs.length}</p>
                </div>
                <div className="bg-white p-5 rounded-[32px] border border-neutral-100 shadow-sm">
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-1">Paid to Suppliers</p>
                    <p className="text-2xl font-bold text-green-600">
                        Rs. {dbPOs.flatMap(po => po.invoices || []).filter(i => i.status === 'Paid' || i.status === 'Confirmed').reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-brand-green p-5 rounded-[32px] shadow-lg shadow-brand-green/20">
                    <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mb-1">Invoiced to Client</p>
                    <p className="text-2xl font-bold text-white">Rs. {tripData.financials.sellingPrice.toLocaleString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Purchase Orders List */}
                <div className="lg:col-span-12 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <FileText className="text-brand-gold" size={20} />
                        <h4 className="text-lg font-serif font-bold text-brand-charcoal">Supplier Purchase Orders</h4>
                    </div>

                    {isLoadingPOs ? (
                        <div className="flex items-center justify-center p-12 bg-neutral-50 rounded-[40px] border border-dashed border-neutral-200">
                            <RefreshCw className="animate-spin text-neutral-400" size={32} />
                        </div>
                    ) : dbPOs.length === 0 ? (
                        <div className="bg-neutral-50 p-12 text-center rounded-[40px] border border-dashed border-neutral-200">
                            <p className="text-neutral-400 italic">No POs generated yet. Click "Sync with Itinerary" to aggregate costs.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {dbPOs.map(po => {
                                const invoice = po.invoices?.[0]; // Show first invoice for summary
                                return (
                                    <div key={po.id} className="bg-white rounded-[32px] border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full tracking-tighter mb-1 inline-block
                                                        ${po.status === 'Draft' ? 'bg-neutral-100 text-neutral-500' :
                                                            po.status === 'Sent' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                                        {po.status}
                                                    </span>
                                                    <h5 className="font-bold text-neutral-800 line-clamp-1">{po.vendor_name || 'Generic Vendor'}</h5>
                                                    <div className="flex flex-col gap-0.5 mt-1">
                                                        <p className="text-[10px] text-brand-gold font-bold uppercase">{po.vendor_type}</p>
                                                        <p className="text-[10px] text-neutral-400 font-mono italic">{po.po_number}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-1">
                                                    <button
                                                        onClick={() => setPreviewPO(po)}
                                                        className="p-1.5 bg-brand-gold/10 text-brand-gold rounded-lg hover:bg-brand-gold hover:text-white transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight"
                                                    >
                                                        <FileText size={12} /> View PO
                                                    </button>
                                                    <p className="text-sm font-bold text-brand-green">Rs. {po.total_amount.toLocaleString()}</p>
                                                    <p className="text-[9px] text-neutral-400">{po.po_date}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-3 mb-6">
                                                {(po.items || []).map(item => (
                                                    <div key={item.id} className="flex flex-col gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-100 relative">
                                                        <button
                                                            onClick={() => deletePOItem(po, item.id)}
                                                            className="absolute -top-1 -right-1 p-1 bg-white border border-neutral-200 rounded-full text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 size={10} />
                                                        </button>
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                {item.day_number && (
                                                                    <span className="shrink-0 text-[8px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded font-black uppercase">Day {item.day_number}</span>
                                                                )}
                                                                {item.service_date && (
                                                                    <span className="shrink-0 text-[8px] text-brand-gold font-bold font-mono">{item.service_date}</span>
                                                                )}
                                                                <span className="text-xs font-bold text-neutral-700 truncate">{item.description}</span>
                                                            </div>
                                                            <span className="text-xs font-bold text-brand-green whitespace-nowrap">Rs. {item.total_price.toLocaleString()}</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {po.vendor_type === 'hotel' && (
                                                                <>
                                                                    <div>
                                                                        <label className="text-[9px] text-neutral-400 uppercase font-bold">Room</label>
                                                                        <input type="text" value={item.room_type || ''} onChange={(e) => updatePOItem(po, item.id, { room_type: e.target.value })} className="w-full bg-white border border-neutral-200 rounded px-2 py-1 text-[10px]" placeholder="e.g. Twin Room" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[9px] text-neutral-400 uppercase font-bold">Meal Plan</label>
                                                                        <select value={item.meal_plan || 'BB'} onChange={(e) => updatePOItem(po, item.id, { meal_plan: e.target.value })} className="w-full bg-white border border-neutral-200 rounded px-2 py-1 text-[10px]">
                                                                            <option value="BB">BB</option>
                                                                            <option value="HB">HB</option>
                                                                            <option value="FB">FB</option>
                                                                            <option value="AI">AI</option>
                                                                        </select>
                                                                    </div>
                                                                </>
                                                            )}
                                                            {po.vendor_type === 'transport' && (
                                                                <div className="col-span-2">
                                                                    <label className="text-[9px] text-neutral-400 uppercase font-bold">Vehicle Type</label>
                                                                    <input type="text" value={item.vehicle_type || ''} onChange={(e) => updatePOItem(po, item.id, { vehicle_type: e.target.value })} className="w-full bg-white border border-neutral-200 rounded px-2 py-1 text-[10px]" placeholder="e.g. Standard SUV" />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <label className="text-[9px] text-neutral-400 uppercase font-bold">Qty / Rms</label>
                                                                <input type="number" min="1" value={item.quantity} onChange={(e) => updatePOItem(po, item.id, { quantity: Number(e.target.value) })} className="w-full bg-white border border-neutral-200 rounded px-2 py-1 text-[10px] text-center" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[9px] text-neutral-400 uppercase font-bold">Unit Price</label>
                                                                <input type="number" min="0" value={item.unit_price} onChange={(e) => updatePOItem(po, item.id, { unit_price: Number(e.target.value) })} className="w-full bg-white border border-neutral-200 rounded px-2 py-1 text-[10px] text-center" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <button onClick={() => addPOItem(po)} className="w-full py-2 border border-dashed border-neutral-300 rounded-xl text-[10px] font-bold text-neutral-400 hover:text-brand-gold hover:border-brand-gold transition-all flex items-center justify-center gap-1">
                                                    <Plus size={12} /> Add Line Item
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {po.status === 'Draft' && (
                                                    <>
                                                        <button
                                                            onClick={() => updatePOStatus(po, 'Sent')}
                                                            className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold uppercase hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <Send size={12} /> Send PO
                                                        </button>
                                                        <button onClick={() => deletePO(po.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100">
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </>
                                                )}
                                                {po.status === 'Sent' && (
                                                    <button
                                                        onClick={() => updatePOStatus(po, 'Accepted')}
                                                        className="flex-1 py-2 bg-green-50 text-green-600 rounded-xl text-[10px] font-bold uppercase hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Check size={12} /> Confirm Accepted
                                                    </button>
                                                )}
                                                {po.status === 'Accepted' && !invoice && (
                                                    <button
                                                        onClick={() => generateInvoice(po)}
                                                        className="flex-1 py-2 bg-brand-gold text-white rounded-xl text-[10px] font-bold uppercase hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Receipt size={12} /> Generate Invoice
                                                    </button>
                                                )}
                                                {invoice && (
                                                    <div className="flex-1 p-2 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${invoice.status === 'Paid' || invoice.status === 'Confirmed' ? 'bg-green-500' :
                                                                invoice.status === 'Received' ? 'bg-blue-500' : 'bg-yellow-500'
                                                                }`}></div>
                                                            <span className="text-[10px] font-bold text-neutral-700">{invoice.status}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => setActivePOId(activePOId === po.id ? null : po.id)}
                                                            className="text-neutral-400 hover:text-brand-gold"
                                                        >
                                                            <ChevronRight size={14} className={activePOId === po.id ? 'rotate-90' : ''} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status Detail Drawer (Inline) */}
                                        {activePOId === po.id && invoice && (
                                            <div className="bg-neutral-50 border-t p-6 space-y-4 animate-in slide-in-from-top duration-300">
                                                <h6 className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-2">
                                                    <Receipt size={12} /> Supplier Invoice: {invoice.invoice_number}
                                                </h6>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-3 bg-white rounded-2xl border border-neutral-100">
                                                        <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-tight mb-1">Invoice Status</p>
                                                        <select
                                                            value={invoice.status}
                                                            onChange={(e) => updateInvoiceStatus(invoice, e.target.value as any)}
                                                            className="w-full bg-transparent border-none p-0 text-xs font-bold focus:ring-0"
                                                        >
                                                            <option value="Pending">Pending</option>
                                                            <option value="Received">Received</option>
                                                            <option value="Paid">Processed Payment</option>
                                                            <option value="Confirmed">Supplier Confirmed Paid</option>
                                                        </select>
                                                    </div>
                                                    <div className="p-3 bg-white rounded-2xl border border-neutral-100">
                                                        <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-tight mb-1">Due Date</p>
                                                        <p className="text-xs font-bold text-red-500">{invoice.due_date}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Legacy Cost Breakdown (Optional - and Selling Price Control) */}
                <div className="lg:col-span-12 mt-8">
                    <div className="bg-white p-8 rounded-[40px] border border-neutral-200 shadow-xl overflow-hidden relative">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-brand-gold/5 rounded-full -mr-16 -mt-16"></div>

                        <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
                            <div className="flex-1 space-y-6">
                                <div>
                                    <h4 className="text-xl font-serif font-bold text-brand-green">Total Project P&L</h4>
                                    <p className="text-sm text-neutral-500">Consolidated margin analysis after all vendor bookings.</p>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div>
                                        <p className="text-[10px] text-neutral-400 font-bold uppercase mb-1">Commitments</p>
                                        <p className="text-xl font-bold text-neutral-800">Rs. {totalInternalCost.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-neutral-400 font-bold uppercase mb-1">Commission/Markup</p>
                                        <p className="text-xl font-bold text-blue-600">Rs. {(tripData.financials.sellingPrice - totalInternalCost).toLocaleString()}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] text-brand-gold font-bold uppercase tracking-widest block mb-2">Final Quote to Guest</label>
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl font-serif text-neutral-400">Rs.</span>
                                            <input
                                                type="number"
                                                value={tripData.financials.sellingPrice}
                                                onChange={(e) => updateFinancials({ ...tripData.financials, sellingPrice: Number(e.target.value) })}
                                                className="w-full text-4xl font-serif font-bold bg-transparent border-none p-0 focus:ring-0 text-brand-green"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-8 rounded-[32px] border-2 flex flex-col items-center justify-center w-full md:w-64 transition-all
                                ${(tripData.financials.sellingPrice - totalInternalCost) > 0 ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Project Margin</p>
                                <p className={`text-5xl font-serif font-bold ${(tripData.financials.sellingPrice - totalInternalCost) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {tripData.financials.sellingPrice > 0 ? (((tripData.financials.sellingPrice - totalInternalCost) / tripData.financials.sellingPrice) * 100).toFixed(1) : 0}%
                                </p>
                                <div className="mt-4 flex items-center gap-2">
                                    {(tripData.financials.sellingPrice - totalInternalCost) > 1000 ? (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-200">
                                            <ShieldCheck size={12} /> PROFITABLE
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-3 py-1 rounded-full border border-red-200">
                                            <AlertTriangle size={12} /> LOSS RISK
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Professional PO Preview Modal */}
            {previewPO && (
                <div id="po-modal-overlay" className="fixed inset-0 z-[100] bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
                    <div id="po-modal-content" className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[40px] shadow-2xl relative flex flex-col">
                        <button
                            onClick={() => setPreviewPO(null)}
                            className="absolute top-6 right-8 p-3 bg-neutral-100 text-neutral-500 rounded-full hover:bg-red-50 hover:text-red-500 transition-all z-20 no-print"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-12 md:p-16 space-y-12">
                            {renderPOContent(previewPO as DBPurchaseOrder & { items: DBPurchaseOrderItem[] })}
                        </div>

                        {/* Sticky Action Footer */}
                        <div className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-neutral-100 p-8 flex items-center justify-center gap-4 no-print">
                            <button
                                onClick={() => window.print()}
                                className="px-8 py-3 bg-brand-charcoal text-white font-bold rounded-2xl hover:bg-black transition-all shadow-xl flex items-center gap-3"
                            >
                                <Send size={18} /> Download / Print PDF
                            </button>
                            <button
                                onClick={() => setPreviewPO(null)}
                                className="px-8 py-3 bg-neutral-100 text-neutral-500 font-bold rounded-2xl hover:bg-neutral-200 transition-all font-mono text-sm uppercase tracking-widest"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Injections Section: This is rendered OUTSIDE all modals and overlays for 100% clean PDF generation */}
            {(previewPO && typeof document !== 'undefined') && createPortal(
                <div id="po-print-only">
                    <div className="p-12 md:p-16 space-y-12 bg-white">
                        {renderPOContent(previewPO as DBPurchaseOrder & { items: DBPurchaseOrderItem[] })}
                    </div>
                </div>,
                document.body
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    /* Hide everything that is a direct child of body except our print section */
                    body > *:not(#po-print-only) { display: none !important; }
                    
                    /* Show ONLY the dedicated print section */
                    #po-print-only { 
                        display: block !important; 
                        visibility: visible !important;
                        position: absolute !important; 
                        top: 0 !important; 
                        left: 0 !important; 
                        width: 100% !important; 
                        height: auto !important;
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        font-size: 9pt !important;
                        line-height: 1.2 !important;
                    }

                    /* Shrink specific elements for print */
                    #po-print-only h1 { font-size: 24pt !important; }
                    #po-print-only h2 { font-size: 18pt !important; }
                    #po-print-only h3 { font-size: 9pt !important; margin-bottom: 0.5rem !important; }
                    #po-print-only .p-12, #po-print-only .p-16 { padding: 1.5rem !important; }
                    #po-print-only .gap-12 { gap: 1.5rem !important; }
                    #po-print-only .gap-8 { gap: 1rem !important; }
                    #po-print-only .py-12 { padding-top: 1rem !important; padding-bottom: 1rem !important; }
                    #po-print-only .pt-16 { padding-top: 1rem !important; }
                    #po-print-only .py-6 { padding-top: 0.4rem !important; padding-bottom: 0.4rem !important; }
                    #po-print-only .space-y-12 > * + * { margin-top: 1.5rem !important; }
                    #po-print-only .space-y-6 > * + * { margin-top: 0.5rem !important; }
                    #po-print-only .space-y-4 > * + * { margin-top: 0.3rem !important; }
                    #po-print-only .rounded-[32px], #po-print-only .rounded-[40px] { border-radius: 12px !important; }
                    #po-print-only table { font-size: 8.5pt !important; }
                    #po-print-only .w-20 { width: 3.5rem !important; height: 3.5rem !important; }
                    
                    /* Force color printing and clean layout */
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    tr { page-break-inside: avoid !important; }
                    @page { margin: 0.5cm; size: auto; }
                }

                @media screen {
                    #po-print-only { display: none !important; }
                }
            `}} />
        </div>
    );
}

// Helper: Common PO Content Renderer
function renderPOContent(po: DBPurchaseOrder & { items: DBPurchaseOrderItem[] }) {
    return (
        <>
            {/* Document Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="flex items-start gap-6">
                    <img src="/images/nilathra_travels_logo.jpeg" alt="Nilathra Travels" className="w-20 h-20 object-contain rounded-2xl border border-neutral-100 shadow-sm" />
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <h1 className="text-4xl font-serif font-black text-brand-charcoal tracking-tight">Nilathra Travels</h1>
                            <p className="text-xs font-bold text-brand-gold uppercase tracking-[0.3em]">By Nilathra Hotel Management (Pvt) Ltd</p>
                        </div>
                        <div className="text-sm text-neutral-500 leading-relaxed font-medium">
                            <p>145, Wajira Road, Colombo 05,</p>
                            <p>Sri Lanka.</p>
                            <p className="mt-2 text-brand-charcoal font-bold">T: +94 77 123 4567 | E: bookings@nilathra.com</p>
                        </div>
                    </div>
                </div>
                <div className="bg-neutral-50 p-6 md:p-8 rounded-[32px] border border-neutral-100 min-w-[280px]">
                    <h2 className="text-2xl font-serif font-bold text-brand-charcoal mb-4">Purchase Order</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                            <span className="text-neutral-400 font-bold uppercase tracking-widest">PO Number</span>
                            <span className="font-mono font-bold text-brand-charcoal">{po.po_number}</span>
                        </div>
                        <div className="flex justify-between text-xs border-t border-neutral-200 pt-3">
                            <span className="text-neutral-400 font-bold uppercase tracking-widest">Issue Date</span>
                            <span className="font-bold text-brand-charcoal">{po.po_date}</span>
                        </div>
                        <div className="flex justify-between text-xs border-t border-neutral-200 pt-3">
                            <span className="text-neutral-400 font-bold uppercase tracking-widest">Status</span>
                            <span className={`px-2 py-0.5 rounded-full font-black uppercase text-[8px] tracking-tighter
                                ${po.status === 'Draft' ? 'bg-neutral-100 text-neutral-500' :
                                    po.status === 'Sent' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                {po.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vendor & Trip Reference */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-b border-neutral-100 py-12">
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">Supplier Information</h3>
                    <div className="space-y-1">
                        <p className="text-xl font-bold text-brand-charcoal">{po.vendor_name}</p>
                        <div className="text-sm text-neutral-500 space-y-1">
                            {po.vendor_address && <p>{po.vendor_address}</p>}
                            {po.vendor_phone && <p>T: {po.vendor_phone}</p>}
                            {po.vendor_email && <p>E: {po.vendor_email}</p>}
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">Trip Information</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-neutral-50 rounded-full flex items-center justify-center text-brand-gold">
                                <Calculator size={14} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-brand-charcoal">Reference Booking</p>
                                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tighter">Please quote PO with Invoice</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-neutral-50 rounded-full flex items-center justify-center text-brand-gold">
                                <RefreshCw size={14} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-brand-charcoal">{po.items?.[0]?.service_date} Start</p>
                                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tighter">Tour Schedule Reference</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Itemized Table */}
            <div className="space-y-6">
                <h3 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">Service Details</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-neutral-100 text-left">
                                <th className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-2">Date</th>
                                <th className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-2">Description</th>
                                <th className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Qty</th>
                                <th className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right whitespace-nowrap">Unit Price (LKR)</th>
                                <th className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right pr-2">Total (LKR)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50">
                            {(po.items || []).map((item: DBPurchaseOrderItem, idx: number) => (
                                <tr key={item.id} className="text-sm">
                                    <td className="py-6 text-neutral-500 pl-2 align-top">{item.service_date}</td>
                                    <td className="py-6 pr-4 align-top">
                                        <div className="space-y-1">
                                            <p className="font-bold text-brand-charcoal">{item.description}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {item.room_type && <span className="text-[9px] bg-neutral-50 text-neutral-500 font-bold uppercase px-1.5 py-0.5 rounded tracking-tighter">Room: {item.room_type}</span>}
                                                {item.meal_plan && <span className="text-[9px] bg-neutral-50 text-neutral-500 font-bold uppercase px-1.5 py-0.5 rounded tracking-tighter">Meal: {item.meal_plan}</span>}
                                                {item.vehicle_type && <span className="text-[9px] bg-neutral-50 text-neutral-500 font-bold uppercase px-1.5 py-0.5 rounded tracking-tighter">Vehicle: {item.vehicle_type}</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6 text-center text-brand-charcoal font-bold align-top">{item.quantity}</td>
                                    <td className="py-6 text-right text-neutral-500 align-top">{(item.unit_price || 0).toLocaleString()}</td>
                                    <td className="py-6 text-right text-brand-charcoal font-bold pr-2 align-top">{(item.total_price || 0).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary & Totals */}
            <div className="flex flex-col md:flex-row justify-between gap-12 pt-8 border-t border-neutral-100">
                <div className="flex-1 space-y-6">
                    <div className="p-8 bg-neutral-50 rounded-[32px] border border-neutral-100">
                        <h4 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] mb-4">Notes & Remarks</h4>
                        <p className="text-xs text-neutral-500 leading-relaxed italic">
                            {po.vendor_notes || "All bookings are subject to our standard terms and conditions. Please confirm acceptance of this purchase order within 48 hours of issuance."}
                        </p>
                    </div>
                </div>
                <div className="w-full md:w-80 space-y-4">
                    <div className="flex justify-between text-sm py-2">
                        <span className="text-neutral-400 font-bold uppercase tracking-widest">Subtotal</span>
                        <span className="font-bold text-brand-charcoal">LKR {po.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-t border-neutral-50">
                        <span className="text-neutral-400 font-bold uppercase tracking-widest">Tax (VAT)</span>
                        <span className="font-bold text-brand-charcoal">LKR {(po.tax || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-6 bg-brand-charcoal text-white rounded-3xl mt-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Total Amount</span>
                        <span className="text-2xl font-serif font-black">LKR {po.total_amount.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Footnote */}
            <div className="text-center pt-16">
                <p className="text-[10px] text-neutral-300 font-bold uppercase tracking-[0.4em] mb-4">Digitally Generated Document • Nilathra Travels Official PO</p>
                <div className="flex justify-center flex-wrap gap-8 grayscale opacity-30">
                    <div className="text-[10px] font-black p-2 border border-neutral-200 uppercase tracking-widest">Confirmed Excellence</div>
                    <div className="text-[10px] font-black p-2 border border-neutral-200 uppercase tracking-widest">Sustainable Sri Lanka</div>
                </div>
            </div>
        </>
    );
}
