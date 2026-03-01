"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, Building2, Car, Compass, UserCircle } from "lucide-react";
import { HotelService, Hotel } from "@/services/hotel.service";
import HotelFormModal from "./components/HotelFormModal";

const DATABASES = [
    { id: 'hotels', label: 'Hotels & Resorts', icon: Building2 },
    { id: 'vendors', label: 'Activity Vendors', icon: Compass },
    { id: 'transport', label: 'Transport Providers', icon: Car },
    { id: 'staff', label: 'System Users', icon: UserCircle },
];

export default function MasterDataPage() {
    const [activeTab, setActiveTab] = useState(DATABASES[0].id);
    const [searchQuery, setSearchQuery] = useState("");

    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

    useEffect(() => {
        if (activeTab === 'hotels') {
            loadHotels();
        }
    }, [activeTab]);

    const loadHotels = async () => {
        setLoading(true);
        try {
            const data = await HotelService.getHotels();
            setHotels(data);
        } catch (error) {
            console.error("Failed to load hotels:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setSelectedHotel(null);
        setIsModalOpen(true);
    };

    const handleEdit = async (hotelId: string) => {
        try {
            const fullHotel = await HotelService.getHotel(hotelId);
            setSelectedHotel(fullHotel);
            setIsModalOpen(true);
        } catch (error) {
            console.error("Failed to fetch full hotel details", error);
        }
    };

    const handleDelete = async (hotelId: string) => {
        if (confirm("Are you sure you want to delete this hotel?")) {
            try {
                await HotelService.deleteHotel(hotelId);
                loadHotels();
            } catch (error) {
                console.error("Failed to delete hotel:", error);
            }
        }
    };

    const filteredHotels = hotels.filter(h =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.location_address && h.location_address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (h.closest_city && h.closest_city.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="max-w-7xl mx-auto p-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-playfair text-[#2B2B2B]">Master Database</h1>
                    <p className="text-[#6B7280] mt-1">Manage global records for vendors, partners, and user accounts.</p>
                </div>
                <button onClick={handleAdd} className="bg-brand-green hover:bg-brand-charcoal text-white px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm text-sm">
                    <Plus size={18} /> Add New Record
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
                {/* Tabs */}
                <div className="flex items-center overflow-x-auto border-b border-neutral-100 px-6">
                    {DATABASES.map(db => {
                        const Icon = db.icon;
                        const isActive = activeTab === db.id;
                        return (
                            <button
                                key={db.id}
                                onClick={() => setActiveTab(db.id)}
                                className={`flex items-center gap-2 px-6 py-4 font-bold text-sm tracking-wide transition-colors border-b-2 ${isActive ? 'border-brand-green text-brand-green bg-brand-green/5' : 'border-transparent text-neutral-500 hover:text-brand-charcoal hover:bg-neutral-50'}`}
                            >
                                <Icon size={16} /> {db.label}
                            </button>
                        );
                    })}
                </div>

                {/* Toolbar */}
                <div className="p-6 border-b border-neutral-100 flex gap-4 bg-neutral-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search records..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-xl text-sm focus:ring-brand-green focus:border-brand-green"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-200 text-xs uppercase tracking-wider font-bold text-neutral-500">
                                <th className="p-4 pl-6">Identifier name</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Location / Zone</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 text-sm text-brand-charcoal font-medium">
                            {activeTab === 'hotels' ? (
                                loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-neutral-500 font-bold">Loading records...</td>
                                    </tr>
                                ) : filteredHotels.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-neutral-500 font-bold">No records found.</td>
                                    </tr>
                                ) : (
                                    filteredHotels.map(row => (
                                        <tr key={row.id} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="p-4 pl-6 font-bold">{row.name}</td>
                                            <td className="p-4 text-neutral-500">{row.hotel_class || 'Not Specified'}</td>
                                            <td className="p-4 text-neutral-500">{row.location_address}{row.closest_city ? `, ${row.closest_city}` : ''}</td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-block px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full ${!row.is_suspended ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {!row.is_suspended ? 'Active' : 'Suspended'}
                                                </span>
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => row.id && handleEdit(row.id)} className="p-2 text-neutral-400 hover:text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => row.id && handleDelete(row.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-neutral-500 font-bold">This section is not implemented yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <HotelFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                hotel={selectedHotel}
                onSave={loadHotels}
            />
        </div>
    );
}
