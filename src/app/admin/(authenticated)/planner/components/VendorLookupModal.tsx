import React, { useState, useMemo } from "react";
import { X, Search, MapPin, DollarSign, CheckCircle2 } from "lucide-react";
import { Vendor } from "@/services/master-data.service";

interface VendorLookupModalProps {
    isOpen: boolean;
    onClose: () => void;
    vendors: Vendor[];
    activityId: number;
    selectedVendorId?: string;
    onSelect: (vendorId: string) => void;
}

export default function VendorLookupModal({ isOpen, onClose, vendors, activityId, selectedVendorId, onSelect }: VendorLookupModalProps) {
    const [nameSearch, setNameSearch] = useState("");
    const [locationSearch, setLocationSearch] = useState("");
    const [maxPrice, setMaxPrice] = useState<number | "">("");

    // Filter vendors who provide this specific activity
    const eligibleVendors = useMemo(() => {
        return vendors.filter(v =>
            v.vendor_activities?.some(va => va.activity_id === activityId)
        ).map(v => {
            const price = v.vendor_activities?.find(va => va.activity_id === activityId)?.vendor_price || 0;
            return { ...v, currentActivityPrice: price };
        });
    }, [vendors, activityId]);

    // Apply search filters
    const filteredVendors = useMemo(() => {
        return eligibleVendors.filter(v => {
            const matchName = v.name.toLowerCase().includes(nameSearch.toLowerCase());
            const matchLoc = !locationSearch || (v.address && v.address.toLowerCase().includes(locationSearch.toLowerCase()));
            const matchPrice = maxPrice === "" || v.currentActivityPrice <= (maxPrice as number);
            return matchName && matchLoc && matchPrice;
        });
    }, [eligibleVendors, nameSearch, locationSearch, maxPrice]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex justify-center items-center overflow-y-auto p-4 sm:p-6">
            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col h-[85vh] max-h-[800px] overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-neutral-100 bg-neutral-50/80">
                    <div>
                        <h2 className="text-xl font-bold text-brand-charcoal font-playfair">Select Preferred Vendor</h2>
                        <p className="text-sm text-neutral-500 mt-1">Choose a vendor for this activity.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-neutral-400 hover:text-red-500 rounded-full hover:bg-neutral-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-6 border-b border-neutral-100 bg-white grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block mb-1">Search Name</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Vendor name..."
                                value={nameSearch}
                                onChange={e => setNameSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all"
                            />
                        </div>
                    </div>
                    <div className="relative">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block mb-1">Search Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Address or city..."
                                value={locationSearch}
                                onChange={e => setLocationSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all"
                            />
                        </div>
                    </div>
                    <div className="relative">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block mb-1">Max Price (USD)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 h-4 w-4" />
                            <input
                                type="number"
                                placeholder="Any price..."
                                value={maxPrice}
                                onChange={e => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
                                className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Vendor Grid */}
                <div className="flex-1 overflow-y-auto p-6 bg-neutral-50/30">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Direct/Internal Option */}
                        <div
                            onClick={() => { onSelect(""); onClose(); }}
                            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between group
                                ${!selectedVendorId ? 'border-brand-green bg-brand-green/5 shadow-sm' : 'border-neutral-200 bg-white hover:border-brand-green/40 hover:shadow-md'}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-bold text-brand-charcoal text-lg">Direct / Internal</h4>
                                    <p className="text-xs text-neutral-500 mt-1">Manage this activity booking internally without assigning a 3rd party vendor.</p>
                                </div>
                                {!selectedVendorId && <CheckCircle2 className="text-brand-green h-6 w-6 shrink-0" />}
                            </div>
                            <div className="mt-auto">
                                <span className={`text-sm font-bold px-4 py-1.5 rounded-lg transition-colors
                                    ${!selectedVendorId ? 'bg-brand-green text-white' : 'bg-neutral-100 text-neutral-500 group-hover:bg-brand-green/10 group-hover:text-brand-green'}`}>
                                    {!selectedVendorId ? 'Selected' : 'Select'}
                                </span>
                            </div>
                        </div>

                        {/* Mapped Vendors */}
                        {filteredVendors.map(vendor => {
                            const isSelected = selectedVendorId === vendor.id;

                            return (
                                <div
                                    key={vendor.id}
                                    onClick={() => { onSelect(vendor.id!); onClose(); }}
                                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col group
                                        ${isSelected ? 'border-brand-green bg-brand-green/5 shadow-sm' : 'border-neutral-200 bg-white hover:border-brand-green/40 hover:shadow-md'}`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1 pr-4 title-wrap">
                                            <h4 className="font-bold text-brand-charcoal text-lg truncate" title={vendor.name}>{vendor.name}</h4>

                                            {vendor.address && (
                                                <p className="text-xs text-neutral-500 flex items-center gap-1 mt-1.5 truncate" title={vendor.address}>
                                                    <MapPin size={12} className="shrink-0" /> <span className="truncate">{vendor.address}</span>
                                                </p>
                                            )}
                                        </div>
                                        {isSelected && <CheckCircle2 className="text-brand-green h-6 w-6 shrink-0" />}
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-neutral-100 flex items-center justify-between">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xs font-bold text-neutral-400">Price:</span>
                                            <span className="text-lg font-bold text-brand-charcoal">${vendor.currentActivityPrice}</span>
                                        </div>
                                        <span className={`text-sm font-bold px-4 py-1.5 rounded-lg transition-colors
                                            ${isSelected ? 'bg-brand-green text-white' : 'bg-neutral-100 text-neutral-500 group-hover:bg-brand-green/10 group-hover:text-brand-green'}`}>
                                            {isSelected ? 'Selected' : 'Select'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}

                        {filteredVendors.length === 0 && (
                            <div className="col-span-1 lg:col-span-2 p-12 text-center text-neutral-400 italic bg-white rounded-2xl border border-neutral-200 shadow-sm">
                                <Search className="h-8 w-8 mx-auto text-neutral-300 mb-3" />
                                No vendors match your search criteria.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
