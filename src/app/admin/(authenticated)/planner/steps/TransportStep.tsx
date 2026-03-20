"use client";

import { TripData, TransportBooking, TravelStyle } from "../types";
import { Car, CarFront, Plus, Trash2, ShieldCheck, FileCheck, Sparkles } from "lucide-react";
import { useEffect } from "react";

const getRecommendedMode = (totalPax: number, style: TravelStyle): TransportBooking['mode'] => {
    if (totalPax <= 3) {
        if (style === 'Regular') return 'SMALL_BUDGET_SEDAN';
        if (style === 'Premium') return 'SMALL_PREMIUM_SEDAN';
        if (style === 'Luxury') return 'SMALL_LUXURY_SUV';
        if (style === 'Ultra VIP') return 'SMALL_ULTRA_VIP_EUROPE_SUV';
        return 'SMALL_PREMIUM_SEDAN';
    } else if (totalPax <= 9) {
        if (style === 'Regular') return 'MEDIUM_BUDGET_VAN';
        if (style === 'Premium') return 'MEDIUM_PREMIUM_HIGHROOF_VAN';
        if (style === 'Luxury') return 'MEDIUM_LUXURY_EXECUTIVE_VAN';
        if (style === 'Ultra VIP') return 'MEDIUM_ULTRA_VIP_EXECUTIVE_VAN';
        return 'MEDIUM_PREMIUM_HIGHROOF_VAN';
    } else {
        if (style === 'Regular') return 'LARGE_BUDGET_MINI_COACH';
        if (style === 'Premium') return 'LARGE_PREMIUM_COACH';
        if (style === 'Luxury') return 'LARGE_LUXURY_EXECUTIVE_COACH';
        if (style === 'Ultra VIP') return 'LARGE_ULTRA_VIP_EUROPE_COACH';
        return 'LARGE_PREMIUM_COACH';
    }
};

export function TransportStep({ tripData, updateTransport }: { tripData: TripData, updateTransport: (t: TransportBooking[]) => void }) {

    const { transports } = tripData;

    const totalPax = (tripData.profile.adults || 0) + (tripData.profile.children || 0);
    const recommended = getRecommendedMode(totalPax, tripData.profile.travelStyle);

    const updateTransportField = (id: string, field: keyof TransportBooking, value: string | boolean | number) => {
        const updated = transports.map(t => t.id === id ? { ...t, [field]: value } : t);
        updateTransport(updated);
    };

    const addVehicle = () => {
        const newTrans: TransportBooking = {
            id: crypto.randomUUID(),
            mode: recommended,
            supplier: '',
            vehicleNumber: '',
            driverName: '',
            driverContact: '',
            guideAssigned: true,
            guideDetails: '',
            status: 'Tentative',
            bookingReference: '',
            paymentStatus: 'Pending',
            contractUrl: ''
        };
        updateTransport([...transports, newTrans]);
    };

    // Auto-fill logic removed because it depended on a removed scope.

    // Disabled state removed because it depended on a removed scope.

    const applyRecommendation = (id: string) => {
        updateTransportField(id, 'mode', recommended);
    };

    const removeTransport = (id: string) => {
        updateTransport(transports.filter(t => t.id !== id));
    };

    const iconForMode = (mode: string) => {
        if (mode.includes('HELICOPTER')) return <ShieldCheck size={16} className="text-brand-gold" />; // Placeholder for heli
        if (mode.includes('PRIVATE_JET')) return <FileCheck size={16} className="text-brand-gold" />; // Placeholder for jet
        return <Car size={16} className="text-brand-gold" />;
    };

    const formatModeLabel = (mode: string) => {
        return mode
            .replace(/SMALL_|MEDIUM_|LARGE_/g, '')
            .split('_')
            .map(word => word.charAt(0) + word.slice(1).toLowerCase())
            .join(' ');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-serif text-brand-green flex items-center gap-2">
                        <CarFront size={20} className="text-brand-gold" /> Logistics & Transport
                    </h3>
                    <p className="text-sm text-neutral-500 mt-1">Configure vehicle segments, assign guides, and lock in supplier bookings.</p>
                </div>
                <button
                    onClick={addVehicle}
                    className="flex items-center gap-2 bg-brand-gold text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors shadow-sm text-sm font-medium"
                >
                    <Plus size={16} /> Assign Vehicle
                </button>
            </div>

            {transports.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200 shadow-sm">
                    <p className="text-neutral-400 text-sm">No vehicles assigned. Click above to allocate a transport mode.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {transports.map((trans, idx) => (
                        <div key={trans.id} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                            <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200 flex justify-between items-center text-sm">
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold text-neutral-700 uppercase tracking-wide">Transport Segment {idx + 1}: {formatModeLabel(trans.mode)}</span>
                                    {iconForMode(trans.mode)}
                                    {trans.mode !== recommended && (
                                        <button
                                            onClick={() => applyRecommendation(trans.id)}
                                            className="flex items-center gap-1.5 text-[10px] bg-brand-gold/10 text-brand-gold px-2 py-1 rounded-full border border-brand-gold/20 hover:bg-brand-gold/20 transition-all font-bold"
                                            title={`Recommended: ${formatModeLabel(recommended)}`}
                                        >
                                            <Sparkles size={10} /> Use Recommended
                                        </button>
                                    )}
                                </div>
                                <button onClick={() => removeTransport(trans.id)} className="text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                                    <Trash2 size={14} /> Remove Segment
                                </button>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">

                                {/* Fleet Details */}
                                <div className="space-y-4 col-span-1 border-r border-neutral-100 pr-4">
                                    <h4 className="font-medium text-brand-green/80 uppercase text-xs tracking-wider border-b pb-2">Fleet Specification</h4>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-bold text-neutral-600 block mb-1">Mode of Transit</label>
                                            <select
                                                value={trans.mode}
                                                onChange={e => updateTransportField(trans.id, 'mode', e.target.value)}
                                                className="w-full px-3 py-2 border rounded-lg text-sm bg-neutral-50 focus:bg-white border-neutral-300 font-bold"
                                            >
                                                <optgroup label="SMALL GROUP (1–3 Pax)">
                                                    <option value="SMALL_BUDGET_SEDAN">Budget Sedan</option>
                                                    <option value="SMALL_PREMIUM_SEDAN">Premium Sedan</option>
                                                    <option value="SMALL_LUXURY_SUV">Luxury SUV</option>
                                                    <option value="SMALL_ULTRA_VIP_EUROPE_SEDAN">Ultra VIP Europe Sedan</option>
                                                    <option value="SMALL_ULTRA_VIP_EUROPE_SUV">Ultra VIP Europe SUV</option>
                                                    <option value="SMALL_ULTRA_VIP_ARMORED_SUV">Ultra VIP Armored SUV</option>
                                                </optgroup>
                                                <optgroup label="MEDIUM GROUP (4–9 Pax)">
                                                    <option value="MEDIUM_BUDGET_VAN">Budget Van</option>
                                                    <option value="MEDIUM_PREMIUM_HIGHROOF_VAN">Premium Highroof Van</option>
                                                    <option value="MEDIUM_LUXURY_EXECUTIVE_VAN">Luxury Executive Van</option>
                                                    <option value="MEDIUM_ULTRA_VIP_EUROPE_SUV_FLEET">Ultra VIP Europe SUV Fleet</option>
                                                    <option value="MEDIUM_ULTRA_VIP_EXECUTIVE_VAN">Ultra VIP Executive Van</option>
                                                    <option value="MEDIUM_ULTRA_VIP_HELICOPTER_TRANSFER">Ultra VIP Helicopter Transfer</option>
                                                </optgroup>
                                                <optgroup label="LARGE GROUP (10–25 Pax)">
                                                    <option value="LARGE_BUDGET_MINI_COACH">Budget Mini Coach</option>
                                                    <option value="LARGE_PREMIUM_COACH">Premium Coach</option>
                                                    <option value="LARGE_LUXURY_EXECUTIVE_COACH">Luxury Executive Coach</option>
                                                    <option value="LARGE_ULTRA_VIP_EUROPE_COACH">Ultra VIP Europe Coach</option>
                                                    <option value="LARGE_ULTRA_VIP_EXECUTIVE_VAN_FLEET">Ultra VIP Executive Van Fleet</option>
                                                    <option value="LARGE_ULTRA_VIP_PRIVATE_JET">Ultra VIP Private Jet</option>
                                                </optgroup>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500 mb-1 block">Logistics Supplier</label>
                                            <input type="text" value={trans.supplier} onChange={e => updateTransportField(trans.id, 'supplier', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white" placeholder="ABC Tours Fleet / Self" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500 mb-1 block">Vehicle Reg / Flight Number</label>
                                            <input type="text" value={trans.vehicleNumber} onChange={e => updateTransportField(trans.id, 'vehicleNumber', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 font-mono tracking-wider focus:bg-white" placeholder="CB-4455" />
                                        </div>
                                    </div>
                                </div>

                                {/* Personnel */}
                                <div className="space-y-4 col-span-1 border-r border-neutral-100 pr-4">
                                    <h4 className="font-medium text-brand-gold/80 uppercase text-xs tracking-wider border-b pb-2">Crew & Guide</h4>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1">Chauffeur/Pilot</label>
                                                <input type="text" value={trans.driverName} onChange={e => updateTransportField(trans.id, 'driverName', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white" placeholder="Name" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1">Crew Contact</label>
                                                <input type="text" value={trans.driverContact} onChange={e => updateTransportField(trans.id, 'driverContact', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white" placeholder="+94..." />
                                            </div>
                                        </div>

                                        <div className="p-3 bg-brand-green/5 border border-brand-green/20 rounded-lg space-y-3">
                                            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-brand-charcoal">
                                                <input type="checkbox" checked={trans.guideAssigned} onChange={e => updateTransportField(trans.id, 'guideAssigned', e.target.checked)} className="rounded text-brand-green" />
                                                National Guide Assigned
                                            </label>
                                            {trans.guideAssigned && (
                                                <div>
                                                    <input type="text" value={trans.guideDetails} onChange={e => updateTransportField(trans.id, 'guideDetails', e.target.value)} className="w-full px-3 py-1.5 border border-neutral-300 rounded text-xs bg-white focus:ring-1 focus:ring-brand-gold" placeholder="Guide Name & License #..." />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Tracking */}
                                <div className="space-y-4 col-span-1">
                                    <h4 className="font-medium text-red-400 uppercase text-xs tracking-wider border-b pb-2">Status & Control</h4>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-bold text-neutral-600 block mb-1">Contract Status</label>
                                            <select
                                                value={trans.status}
                                                onChange={e => updateTransportField(trans.id, 'status', e.target.value)}
                                                className={`w-full px-3 py-2 border rounded-lg text-sm font-bold focus:ring-1 
                                                    ${trans.status === 'Confirmed' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-yellow-50 text-yellow-700 border-yellow-300'}`}
                                            >
                                                <option value="Tentative">Pending Fleet Allocation</option>
                                                <option value="Confirmed">Vehicle Locked & Confirmed</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1">Supplier Ref/Voucher</label>
                                            <input type="text" value={trans.bookingReference} onChange={e => updateTransportField(trans.id, 'bookingReference', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm font-mono bg-neutral-50 focus:bg-white" placeholder="TR-12503..." />
                                        </div>

                                        <div className="flex items-center gap-2 p-2 bg-neutral-50 border border-neutral-200 rounded-lg">
                                            <label className="text-xs text-neutral-600 font-medium whitespace-nowrap">Payment</label>
                                            <select
                                                value={trans.paymentStatus}
                                                onChange={e => updateTransportField(trans.id, 'paymentStatus', e.target.value)}
                                                className={`w-full p-1 border rounded text-xs font-bold
                                                     ${trans.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                                            >
                                                <option value="Pending">Pending / Unpaid</option>
                                                <option value="Paid">Fully Settled</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
