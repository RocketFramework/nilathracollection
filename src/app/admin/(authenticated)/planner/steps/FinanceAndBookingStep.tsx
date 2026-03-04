"use client";

import { TripData, DBPurchaseOrder, DBPurchaseOrderItem, DBVendorInvoice, Financials, POStatus } from "../types";
import { Calculator, Receipt, Send, CheckCircle2, AlertTriangle, RefreshCw, Plus, FileText, ChevronRight, Check, X, ShieldCheck, Trash2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import {
    getHotelsListAction,
    getVendorsAction,
    getTransportProvidersAction,
    getTourGuidesAction,
    getRestaurantsAction,
    getPurchaseOrdersAction,
    savePurchaseOrderAction,
    deletePurchaseOrderAction,
    saveVendorInvoiceAction,
    saveVendorPaymentAction
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
    }, [tourId]);

    // AGGREGATION ENGINE: Scans trip data to build recommended POs
    const syncWithItinerary = async () => {
        if (!tourId) {
            alert("Tour must be saved before generating POs.");
            return;
        }
        setIsSyncing(true);
        try {
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

            // Identify POs that should not be touched
            const preservedPOs = dbPOs.filter(po => po.status !== 'Pending Confirmation' && po.status !== 'Draft');
            const preservedLinkedBlockIds = new Set<string>();
            preservedPOs.forEach(po => {
                po.items?.forEach(item => {
                    if (item.tour_itinerary_id) {
                        // In DB it might be numeric ID, in JSONB it's usually block.id
                        // We'll need to be careful with comparison. 
                        // For now we assume block.id exists in the context of it being a string.
                    }
                });
            });

            const newPOs: Partial<DBPurchaseOrder>[] = [];

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
                let vendorId = '';
                let vendorName = '';
                let vendorType: DBPurchaseOrder['vendor_type'] = 'other';
                let vendorAddress = '';
                let vendorPhone = '';
                let vendorEmail = '';
                let vendorRef: any = {};

                let price = block.agreedPrice || 0;
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
                    roomConfig = 'Standard Room';
                    mlPlan = 'BB';
                } else if (block.type === 'activity' && block.vendorId) {
                    const vendor = vendors.find((v: any) => v.id === block.vendorId);
                    vendorId = block.vendorId;
                    vendorRef = { activity_vendor_id: block.vendorId };
                    vendorName = vendor ? vendor.name : (block.serviceProvider || block.name);
                    vendorAddress = vendor?.address || '';
                    vendorPhone = vendor?.phone || '';
                    vendorEmail = vendor?.email || '';
                    vendorType = 'vendor';
                } else if (block.type === 'travel' && block.transportId) {
                    const provider = transports.find((t: any) => t.id === block.transportId);
                    vendorId = block.transportId;
                    vendorRef = { transport_provider_id: block.transportId };
                    vendorName = provider ? provider.name : (block.serviceProvider || 'Transport Provider');
                    vendorAddress = provider?.address || '';
                    vendorPhone = provider?.phone || '';
                    vendorEmail = provider?.email || '';
                    vendorType = 'transport';
                    vhType = 'Standard Vehicle';
                } else if (block.type === 'guide' && block.guideId) {
                    const guide = guides.find((g: any) => g.id === block.guideId);
                    vendorId = block.guideId;
                    vendorRef = { guide_id: block.guideId };
                    vendorName = guide ? `${guide.first_name} ${guide.last_name || ''}`.trim() : (block.serviceProvider || block.name);
                    vendorPhone = guide?.phone || '';
                    vendorType = 'guide';
                } else if (block.type === 'meal' && block.restaurantId) {
                    const rest = restaurants.find((r: any) => r.id === block.restaurantId);
                    vendorId = block.restaurantId;
                    vendorRef = { restaurant_id: block.restaurantId };
                    vendorName = rest ? rest.name : (block.serviceProvider || block.name);
                    vendorAddress = rest?.address || '';
                    vendorPhone = rest?.contact_number || '';
                    vendorEmail = rest?.email || '';
                    vendorType = 'vendor';
                }

                if (!vendorId) return;

                const item: Partial<DBPurchaseOrderItem> = {
                    id: crypto.randomUUID(),
                    description: block.name,
                    service_date: block.type === 'sleep' ? `Night ${block.dayNumber}` : `Day ${block.dayNumber}`,
                    quantity: 1,
                    unit_price: price,
                    total_price: price,
                    tour_itinerary_id: block.id,
                    room_type: roomConfig,
                    meal_plan: mlPlan,
                    vehicle_type: vhType
                };

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

            const syncPromises: Promise<any>[] = [];

            vendorMap.forEach((data, _vendorId) => {
                const total = data.items.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);
                const poData: Partial<DBPurchaseOrder> = {
                    tour_id: tourId,
                    vendor_type: data.type,
                    vendor_name: data.name, // virtual for UI
                    currency: 'LKR',
                    status: 'Draft',
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
                <div className="flex items-center gap-3">
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
                                                        <p className="text-[10px] text-neutral-400 font-mono">{po.po_number}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
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
                                                            <span className="text-xs font-bold text-neutral-700">{item.description}</span>
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
        </div>
    );
}
