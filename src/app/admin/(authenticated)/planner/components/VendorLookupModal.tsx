import React, { useState, useMemo, useEffect } from "react";
import { X, Search, MapPin, DollarSign, CheckCircle2, Loader2 } from "lucide-react";
import { MasterDataService, Vendor } from "@/services/master-data.service";

interface VendorLookupModalProps {
    isOpen: boolean;
    onClose: () => void;
    activityId: number;
    selectedVendorId?: string;
    onSelect: (vendorId: string, price?: number) => void;
}

export default function VendorLookupModal({ isOpen, onClose, activityId, selectedVendorId, onSelect }: VendorLookupModalProps) {
    const [nameSearch, setNameSearch] = useState("");
    const [locationSearch, setLocationSearch] = useState("");
    const [maxPrice, setMaxPrice] = useState<number | "">("");

    const [eligibleVendors, setEligibleVendors] = useState<(Vendor & { currentActivityPrice: number })[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !activityId) return;

        const loadVendors = async () => {
            setIsLoading(true);
            try {
                const fetchedVendors = await MasterDataService.getVendorsForActivity(activityId);
                const mapped = fetchedVendors.map(v => {
                    const price = v.vendor_activities?.[0]?.vendor_price || 0;
                    return { ...v, currentActivityPrice: price };
                });
                setEligibleVendors(mapped);
            } catch (err) {
                console.error("Failed to load vendors for activity:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadVendors();
    }, [isOpen, activityId]);

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

                {/* Vendor Table View */}
                <div className="flex-1 overflow-y-auto p-0 bg-white">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-neutral-50 sticky top-0 z-10 border-b border-neutral-200">
                            <tr>
                                <th className="py-3 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Vendor Name</th>
                                <th className="py-3 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Location</th>
                                <th className="py-3 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider text-right">Price (USD)</th>
                                <th className="py-3 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider text-center">Status</th>
                                <th className="py-3 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {/* Direct/Internal Option */}
                            <tr
                                onClick={() => { onSelect(""); onClose(); }}
                                className={`cursor-pointer transition-colors hover:bg-neutral-50 group
                                    ${!selectedVendorId ? 'bg-brand-green/5' : ''}`}
                            >
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-brand-charcoal text-sm">Direct / Internal</h4>
                                    </div>
                                    <p className="text-[11px] text-neutral-500 mt-0.5">Manage internally (no 3rd party)</p>
                                </td>
                                <td className="py-4 px-6 text-sm text-neutral-500">-</td>
                                <td className="py-4 px-6 text-sm font-bold text-brand-charcoal text-right">-</td>
                                <td className="py-4 px-6 text-center">
                                    {!selectedVendorId ? (
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-green/10 text-brand-green text-xs font-bold">
                                            <CheckCircle2 size={14} />
                                            Selected
                                        </div>
                                    ) : (
                                        <span className="text-xs text-neutral-400">Not Selected</span>
                                    )}
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <span className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors inline-block
                                        ${!selectedVendorId ? 'bg-brand-green text-white' : 'bg-neutral-100 text-neutral-500 group-hover:bg-brand-green/10 group-hover:text-brand-green'}`}>
                                        {!selectedVendorId ? 'Selected' : 'Select'}
                                    </span>
                                </td>
                            </tr>

                            {/* Mapped Vendors */}
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-neutral-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <Loader2 className="h-8 w-8 text-brand-gold animate-spin mb-3" />
                                            Loading eligible vendors...
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {filteredVendors.map(vendor => {
                                        const isSelected = selectedVendorId === vendor.id;

                                        return (
                                            <tr
                                                key={vendor.id}
                                                onClick={() => { onSelect(vendor.id!, vendor.currentActivityPrice); onClose(); }}
                                                className={`cursor-pointer transition-colors hover:bg-neutral-50 group
                                                    ${isSelected ? 'bg-brand-green/5' : ''}`}
                                            >
                                                <td className="py-4 px-6">
                                                    <h4 className="font-bold text-brand-charcoal text-sm truncate max-w-[250px]" title={vendor.name}>
                                                        {vendor.name}
                                                    </h4>
                                                </td>
                                                <td className="py-4 px-6">
                                                    {vendor.address ? (
                                                        <div className="flex items-center gap-1.5 text-sm text-neutral-500" title={vendor.address}>
                                                            <MapPin size={14} className="shrink-0 text-neutral-400" />
                                                            <span className="truncate max-w-[200px]">{vendor.address}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-neutral-400 italic">No address</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-sm font-bold text-brand-charcoal text-right">
                                                    ${vendor.currentActivityPrice.toFixed(2)}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    {isSelected ? (
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-green/10 text-brand-green text-xs font-bold">
                                                            <CheckCircle2 size={14} />
                                                            Selected
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-neutral-400">Not Selected</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <span className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors inline-block
                                                        ${isSelected ? 'bg-brand-green text-white' : 'bg-neutral-100 text-neutral-500 group-hover:bg-brand-green/10 group-hover:text-brand-green'}`}>
                                                        {isSelected ? 'Selected' : 'Select'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {filteredVendors.length === 0 && !isLoading && (
                                        <tr>
                                            <td colSpan={5} className="py-16 text-center text-neutral-400 italic">
                                                <Search className="h-8 w-8 mx-auto text-neutral-300 mb-3" />
                                                No vendors match your search criteria.
                                            </td>
                                        </tr>
                                    )}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
