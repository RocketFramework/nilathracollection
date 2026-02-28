"use client";

import { TripData, TransportBooking } from "../types";
import { Car, CarFront, Plus, Trash2, ShieldCheck, FileCheck } from "lucide-react";

export function TransportStep({ tripData, updateTransport }: { tripData: TripData, updateTransport: (t: TransportBooking[]) => void }) {

    if (!tripData.serviceScopes.includes('Arrange Transport')) {
        return (
            <div className="bg-neutral-50 p-12 text-center rounded-3xl border border-dashed border-neutral-300">
                <CarFront className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium text-neutral-600">Transport Module Disabled</h3>
                <p className="text-sm text-neutral-400 mt-2">To align logistics and vehicles, enable "Arrange Transport" in Step 1.</p>
            </div>
        );
    }

    const { transports } = tripData;

    const addVehicle = () => {
        const newTrans: TransportBooking = {
            id: crypto.randomUUID(),
            mode: 'SUV',
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

    const removeTransport = (id: string) => {
        updateTransport(transports.filter(t => t.id !== id));
    };

    const updateTransportField = (id: string, field: keyof TransportBooking, value: any) => {
        const updated = transports.map(t => t.id === id ? { ...t, [field]: value } : t);
        updateTransport(updated);
    };

    const iconForMode = (mode: string) => {
        return <Car size={16} className="text-brand-gold" />;
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
                                    <span className="font-semibold text-neutral-700 uppercase tracking-wide">Transport Segment {idx + 1}</span>
                                    {iconForMode(trans.mode)}
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
                                                {['Sedan', 'SUV', 'Luxury Van', 'Bus', 'Tuk Tuk', 'Helicopter', 'Private Jet', 'Train'].map(m => (
                                                    <option key={m} value={m}>{m}</option>
                                                ))}
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
