"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, Building2, Car, Compass, UserCircle } from "lucide-react";
import { MasterDataService, Vendor, Driver, TourGuide, TransportProvider } from "@/services/master-data.service";
import { HotelService, Hotel } from "@/services/hotel.service";
import HotelFormModal from "./components/HotelFormModal";
import VendorFormModal from "./components/VendorFormModal";
import DriverFormModal from "./components/DriverFormModal";
import TourGuideFormModal from "./components/TourGuideFormModal";
import TransportProviderFormModal from "./components/TransportProviderFormModal";

const DATABASES = [
    { id: 'hotels', label: 'Hotels & Resorts', icon: Building2 },
    { id: 'vendors', label: 'Activity Vendors', icon: Compass },
    { id: 'transports', label: 'Transport Providers', icon: Car },
    { id: 'drivers', label: 'Drivers', icon: UserCircle },
    { id: 'guides', label: 'Tour Guides', icon: UserCircle },
];

export default function MasterDataPage() {
    const [activeTab, setActiveTab] = useState(DATABASES[0].id);
    const [searchQuery, setSearchQuery] = useState("");

    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [guides, setGuides] = useState<TourGuide[]>([]);
    const [transports, setTransports] = useState<TransportProvider[]>([]);

    const [loading, setLoading] = useState(true);

    // Modal State
    const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

    const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
    const [selectedGuide, setSelectedGuide] = useState<TourGuide | null>(null);

    const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
    const [selectedTransport, setSelectedTransport] = useState<TransportProvider | null>(null);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'hotels') {
                const data = await HotelService.getHotels();
                setHotels(data);
            } else if (activeTab === 'vendors') {
                const data = await MasterDataService.getVendors();
                setVendors(data);
            } else if (activeTab === 'transports') {
                const data = await MasterDataService.getTransportProviders();
                setTransports(data);
            } else if (activeTab === 'drivers') {
                const data = await MasterDataService.getDrivers();
                setDrivers(data);
            } else if (activeTab === 'guides') {
                const data = await MasterDataService.getTourGuides();
                setGuides(data);
            }
        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        if (activeTab === 'hotels') {
            setSelectedHotel(null);
            setIsHotelModalOpen(true);
        } else if (activeTab === 'vendors') {
            setSelectedVendor(null);
            setIsVendorModalOpen(true);
        } else if (activeTab === 'transports') {
            setSelectedTransport(null);
            setIsTransportModalOpen(true);
        } else if (activeTab === 'drivers') {
            setSelectedDriver(null);
            setIsDriverModalOpen(true);
        } else if (activeTab === 'guides') {
            setSelectedGuide(null);
            setIsGuideModalOpen(true);
        }
    };

    const handleEdit = async (id: string) => {
        try {
            if (activeTab === 'hotels') {
                const fullItem = await HotelService.getHotel(id);
                setSelectedHotel(fullItem);
                setIsHotelModalOpen(true);
            } else if (activeTab === 'vendors') {
                const fullItem = await MasterDataService.getVendor(id);
                setSelectedVendor(fullItem);
                setIsVendorModalOpen(true);
            } else if (activeTab === 'transports') {
                const fullItem = await MasterDataService.getTransportProvider(id);
                setSelectedTransport(fullItem);
                setIsTransportModalOpen(true);
            } else if (activeTab === 'drivers') {
                const fullItem = await MasterDataService.getDriver(id);
                setSelectedDriver(fullItem);
                setIsDriverModalOpen(true);
            } else if (activeTab === 'guides') {
                const fullItem = await MasterDataService.getTourGuide(id);
                setSelectedGuide(fullItem);
                setIsGuideModalOpen(true);
            }
        } catch (error) {
            console.error("Failed to fetch full details", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) {
            try {
                if (activeTab === 'hotels') await HotelService.deleteHotel(id);
                else if (activeTab === 'vendors') await MasterDataService.deleteVendor(id);
                else if (activeTab === 'transports') await MasterDataService.deleteTransportProvider(id);
                else if (activeTab === 'drivers') await MasterDataService.deleteDriver(id);
                else if (activeTab === 'guides') await MasterDataService.deleteTourGuide(id);
                loadData();
            } catch (error) {
                console.error("Failed to delete record:", error);
            }
        }
    };

    const filteredHotels = hotels.filter(h =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.location_address && h.location_address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (h.closest_city && h.closest_city.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredVendors = vendors.filter(v =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.phone && v.phone.includes(searchQuery))
    );

    const filteredTransports = transports.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredDrivers = drivers.filter(d =>
        d.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.last_name && d.last_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredGuides = guides.filter(g =>
        g.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.last_name && g.last_name.toLowerCase().includes(searchQuery.toLowerCase()))
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
                                            <td className="p-4 text-neutral-500">{row.location_address || 'Not Specified'}{row.closest_city ? `, ${row.closest_city}` : ''}</td>
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
                            ) : activeTab === 'vendors' ? (
                                loading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-neutral-500 font-bold">Loading records...</td></tr>
                                ) : filteredVendors.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-neutral-500 font-bold">No records found.</td></tr>
                                ) : (
                                    filteredVendors.map(row => (
                                        <tr key={row.id} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="p-4 pl-6 font-bold">{row.name}</td>
                                            <td className="p-4 text-neutral-500">Vendor</td>
                                            <td className="p-4 text-neutral-500">{row.phone || row.email || 'No Contact'}</td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-block px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full ${!row.is_suspended ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {!row.is_suspended ? 'Active' : 'Suspended'}
                                                </span>
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => row.id && handleEdit(row.id)} className="p-2 text-neutral-400 hover:text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                                    <button onClick={() => row.id && handleDelete(row.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )
                            ) : activeTab === 'drivers' ? (
                                loading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-neutral-500 font-bold">Loading records...</td></tr>
                                ) : filteredDrivers.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-neutral-500 font-bold">No records found.</td></tr>
                                ) : (
                                    filteredDrivers.map(row => (
                                        <tr key={row.id} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="p-4 pl-6 font-bold">{row.first_name} {row.last_name || ''}</td>
                                            <td className="p-4 text-neutral-500">Driver</td>
                                            <td className="p-4 text-neutral-500">{row.phone || 'No Contact'}</td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-block px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full ${!row.is_suspended ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {!row.is_suspended ? 'Active' : 'Suspended'}
                                                </span>
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => row.id && handleEdit(row.id)} className="p-2 text-neutral-400 hover:text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                                    <button onClick={() => row.id && handleDelete(row.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )
                            ) : activeTab === 'transports' ? (
                                loading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-neutral-500 font-bold">Loading records...</td></tr>
                                ) : filteredTransports.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-neutral-500 font-bold">No records found.</td></tr>
                                ) : (
                                    filteredTransports.map(row => (
                                        <tr key={row.id} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="p-4 pl-6 font-bold">{row.name}</td>
                                            <td className="p-4 text-neutral-500">Transport Provider</td>
                                            <td className="p-4 text-neutral-500">{(row.vehicle_types || []).join(', ') || 'Various'}</td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-block px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full ${!row.is_suspended ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {!row.is_suspended ? 'Active' : 'Suspended'}
                                                </span>
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => row.id && handleEdit(row.id)} className="p-2 text-neutral-400 hover:text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                                    <button onClick={() => row.id && handleDelete(row.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )
                            ) : activeTab === 'guides' ? (
                                loading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-neutral-500 font-bold">Loading records...</td></tr>
                                ) : filteredGuides.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-neutral-500 font-bold">No records found.</td></tr>
                                ) : (
                                    filteredGuides.map(row => (
                                        <tr key={row.id} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="p-4 pl-6 font-bold">{row.first_name} {row.last_name || ''}</td>
                                            <td className="p-4 text-neutral-500">Tour Guide</td>
                                            <td className="p-4 text-neutral-500">{row.phone || 'No Contact'}</td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-block px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full ${!row.is_suspended ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {!row.is_suspended ? 'Active' : 'Suspended'}
                                                </span>
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => row.id && handleEdit(row.id)} className="p-2 text-neutral-400 hover:text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                                    <button onClick={() => row.id && handleDelete(row.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )
                            ) : (
                                <tr><td colSpan={5} className="p-8 text-center text-neutral-500 font-bold">Invalid category.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <HotelFormModal
                isOpen={isHotelModalOpen}
                onClose={() => setIsHotelModalOpen(false)}
                hotel={selectedHotel}
                onSave={loadData}
            />
            <VendorFormModal
                isOpen={isVendorModalOpen}
                onClose={() => setIsVendorModalOpen(false)}
                vendor={selectedVendor}
                onSave={loadData}
            />
            <DriverFormModal
                isOpen={isDriverModalOpen}
                onClose={() => setIsDriverModalOpen(false)}
                driver={selectedDriver}
                onSave={loadData}
            />
            <TourGuideFormModal
                isOpen={isGuideModalOpen}
                onClose={() => setIsGuideModalOpen(false)}
                guide={selectedGuide}
                onSave={loadData}
            />
            <TransportProviderFormModal
                isOpen={isTransportModalOpen}
                onClose={() => setIsTransportModalOpen(false)}
                provider={selectedTransport}
                onSave={loadData}
            />
        </div>
    );
}
