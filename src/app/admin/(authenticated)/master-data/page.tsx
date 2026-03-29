"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight, Building2, Car, Compass, UserCircle, Utensils, Inbox, Eye } from "lucide-react";
import { MasterDataService, Vendor, Driver, TourGuide, TransportProvider, Restaurant } from "@/services/master-data.service";
import { HotelService, Hotel } from "@/services/hotel.service";
import { getUserRoleAction, getPendingApprovalsAction } from "@/actions/admin.actions";
import HotelFormModal from "./components/HotelFormModal";
import VendorFormModal from "./components/VendorFormModal";
import DriverFormModal from "./components/DriverFormModal";
import TourGuideFormModal from "./components/TourGuideFormModal";
import TransportProviderFormModal from "./components/TransportProviderFormModal";
import RestaurantFormModal from "./components/RestaurantFormModal";
import ApprovalReviewModal from "./components/ApprovalReviewModal";
import { MasterDataApprovalsService, ApprovalRequest } from "@/services/master-data-approvals.service";

const DATABASES = [
    { id: 'hotels', label: 'Hotels & Resorts', icon: Building2 },
    { id: 'vendors', label: 'Activity Vendors', icon: Compass },
    { id: 'restaurants', label: 'Restaurants', icon: Utensils },
    { id: 'transports', label: 'Transport Providers', icon: Car },
    { id: 'drivers', label: 'Drivers', icon: UserCircle },
    { id: 'guides', label: 'Tour Guides', icon: UserCircle },
];

export default function MasterDataPage() {
    const [activeTab, setActiveTab] = useState(DATABASES[0].id);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [userRole, setUserRole] = useState<string>("agent");

    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [guides, setGuides] = useState<TourGuide[]>([]);
    const [transports, setTransports] = useState<TransportProvider[]>([]);
    const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);

    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [sortBy, setSortBy] = useState<string>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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

    const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);

    useEffect(() => {
        const fetchRole = async () => {
            const res = await getUserRoleAction();
            if (res && res.role) {
                setUserRole(res.role);
            }
        };
        fetchRole();
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(0); // Reset to first page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        setCurrentPage(0);
        if (activeTab === 'drivers' || activeTab === 'guides') {
            setSortBy('first_name');
        } else {
            setSortBy('name');
        }
    }, [activeTab]);

    useEffect(() => {
        loadData();
    }, [activeTab, debouncedSearch, currentPage, pageSize, sortBy, sortOrder]);

    const loadData = async () => {
        setLoading(true);
        try {
            const options = {
                searchTerm: debouncedSearch,
                page: currentPage,
                pageSize,
                sortBy,
                sortOrder
            };

            if (activeTab === 'hotels') {
                const { data, count } = await HotelService.getHotels(options);
                setHotels(data);
                setTotalCount(count);
            } else if (activeTab === 'vendors') {
                const { data, count } = await MasterDataService.getVendors(options);
                setVendors(data);
                setTotalCount(count);
            } else if (activeTab === 'restaurants') {
                const { data, count } = await MasterDataService.getRestaurants(options);
                setRestaurants(data);
                setTotalCount(count);
            } else if (activeTab === 'transports') {
                const { data, count } = await MasterDataService.getTransportProviders(options);
                setTransports(data);
                setTotalCount(count);
            } else if (activeTab === 'drivers') {
                const { data, count } = await MasterDataService.getDrivers(options);
                setDrivers(data);
                setTotalCount(count);
            } else if (activeTab === 'guides') {
                const { data, count } = await MasterDataService.getTourGuides(options);
                setGuides(data);
                setTotalCount(count);
            } else if (activeTab === 'approvals') {
                const result = await getPendingApprovalsAction();
                if (result.success && result.data) {
                    setApprovals(result.data);
                    setTotalCount(result.data.length);
                } else {
                    console.error("Failed to load approvals:", result.error);
                }
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
        } else if (activeTab === 'restaurants') {
            setSelectedRestaurant(null);
            setIsRestaurantModalOpen(true);
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
            } else if (activeTab === 'restaurants') {
                const fullItem = await MasterDataService.getRestaurant(id);
                setSelectedRestaurant(fullItem);
                setIsRestaurantModalOpen(true);
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
                else if (activeTab === 'restaurants') await MasterDataService.deleteRestaurant(id);
                else if (activeTab === 'transports') await MasterDataService.deleteTransportProvider(id);
                else if (activeTab === 'drivers') await MasterDataService.deleteDriver(id);
                else if (activeTab === 'guides') await MasterDataService.deleteTourGuide(id);
                loadData();
            } catch (error) {
                console.error("Failed to delete record:", error);
            }
        }
    };

    const toggleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
        setCurrentPage(0);
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    const renderSortIcon = (field: string) => {
        if (sortBy !== field) return <Search size={10} className="ml-1 opacity-0 group-hover:opacity-50" />;
        return sortOrder === 'asc' ? <span className="ml-1">↑</span> : <span className="ml-1">↓</span>;
    };

    return (
        <div className="max-w-7xl mx-auto p-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-playfair text-[#2B2B2B]">Master Database</h1>
                    <p className="text-[#6B7280] mt-1">Manage global records for vendors, partners, and user accounts.</p>
                </div>
                {activeTab !== 'approvals' && (
                    <button onClick={handleAdd} className="bg-brand-green hover:bg-brand-charcoal text-white px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm text-sm">
                        <Plus size={18} /> Add New Record
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
                {/* Tabs */}
                <div className="flex items-center overflow-x-auto border-b border-neutral-100 px-6">
                    {(userRole === 'admin' ? [{ id: 'approvals', label: 'Pending Approvals', icon: Inbox }, ...DATABASES] : DATABASES).map(db => {
                        const Icon = db.icon;
                        const isActive = activeTab === db.id;
                        return (
                            <button
                                key={db.id}
                                onClick={() => setActiveTab(db.id)}
                                className={`flex items-center gap-2 px-6 py-4 font-bold text-sm tracking-wide transition-colors border-b-2 ${isActive ? 'border-brand-green text-brand-green bg-brand-green/5' : 'border-transparent text-neutral-500 hover:text-brand-charcoal hover:bg-neutral-50'}`}
                            >
                                <Icon size={16} /> {db.label}
                                {db.id === 'approvals' && approvals.length > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{approvals.length}</span>
                                )}
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
                                <th className="p-4 pl-6">
                                    {activeTab === 'approvals' ? 'Request Type' : 'Identifier name'}
                                </th>
                                <th className="p-4">
                                    {activeTab === 'approvals' ? 'Entity Context' : 'Category'}
                                </th>
                                <th onClick={() => activeTab !== 'approvals' && toggleSort(activeTab === 'drivers' || activeTab === 'guides' ? 'first_name' : 'name')} className={`p-4 pl-6 text-left text-[10px] uppercase font-black tracking-widest ${activeTab === 'approvals' ? 'text-neutral-500' : 'text-neutral-400 cursor-pointer group hover:text-brand-green'}`}>
                                    <div className="flex items-center">
                                        {activeTab === 'approvals' ? 'Requested By' : activeTab === 'drivers' || activeTab === 'guides' ? 'Full Name' : (activeTab === 'hotels' ? 'Hotel Name' : 'Name')}
                                        {activeTab !== 'approvals' && renderSortIcon(activeTab === 'drivers' || activeTab === 'guides' ? 'first_name' : 'name')}
                                    </div>
                                </th>
                                <th className="p-4 text-left text-[10px] uppercase font-black text-neutral-400 tracking-widest">
                                    {activeTab === 'approvals' ? 'Date' : 'Category'}
                                </th>
                                {activeTab !== 'approvals' && (
                                    <th className="p-4 text-left text-[10px] uppercase font-black text-neutral-400 tracking-widest">
                                        {activeTab === 'hotels' ? 'Rooms' : (activeTab === 'vendors' ? 'Phone' : (activeTab === 'restaurants' ? 'Cuisine / Phone' : (activeTab === 'transports' ? 'Vehicles' : 'Contact')))}
                                    </th>
                                )}
                                <th onClick={() => activeTab !== 'approvals' && toggleSort('is_suspended')} className={`p-4 text-center text-[10px] uppercase font-black tracking-widest ${activeTab === 'approvals' ? 'text-neutral-500' : 'text-neutral-400 cursor-pointer group hover:text-brand-green'}`}>
                                    <div className="flex items-center justify-center">
                                        Status
                                        {activeTab !== 'approvals' && renderSortIcon('is_suspended')}
                                    </div>
                                </th>
                                <th className="p-4 pr-6 text-right text-[10px] uppercase font-black text-neutral-400 tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 text-sm text-brand-charcoal font-medium">
                            {activeTab === 'approvals' ? (
                                loading ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-neutral-500 font-bold">Loading records...</td></tr>
                                ) : approvals.length === 0 ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-neutral-500 font-bold">No pending approvals found.</td></tr>
                                ) : (
                                    approvals.map(row => (
                                        <tr key={row.id} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="p-4 pl-6 font-bold capitalize">
                                                <span className={`inline-block px-2 py-0.5 text-[10px] rounded mr-2 ${row.action === 'CREATE' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{row.action}</span>
                                                {row.entity_type}
                                            </td>
                                            <td className="p-4 text-neutral-500">
                                                {row.contact_details?.name || 'Unknown Contact'}
                                            </td>
                                            <td className="p-4 pl-6 text-neutral-500">
                                                {((row as any).agent?.first_name ? `${(row as any).agent.first_name} ${(row as any).agent.last_name || ''}` : row.requested_by)}
                                            </td>
                                            <td className="p-4 text-neutral-500 text-xs">
                                                {new Date(row.created_at!).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="inline-block px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full bg-amber-100 text-amber-700">
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => { setSelectedApproval(row); setIsApprovalModalOpen(true); }} className="px-3 py-1.5 text-xs font-bold text-brand-green bg-brand-green/10 hover:bg-brand-green/20 rounded-lg transition-colors flex items-center gap-1"><Eye size={14} /> Review</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )
                            ) : activeTab === 'hotels' ? (
                                loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-neutral-500 font-bold">Loading records...</td>
                                    </tr>
                                ) : hotels.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-neutral-500 font-bold">No records found.</td>
                                    </tr>
                                ) : (
                                    hotels.map(row => (
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
                                ) : vendors.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-neutral-500 font-bold">No records found.</td></tr>
                                ) : (
                                    vendors.map(row => (
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
                            ) : activeTab === 'restaurants' ? (
                                loading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-neutral-500 font-bold">Loading records...</td></tr>
                                ) : restaurants.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-neutral-500 font-bold">No records found.</td></tr>
                                ) : (
                                    restaurants.map(row => (
                                        <tr key={row.id} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="p-4 pl-6 font-bold">{row.name}</td>
                                            <td className="p-4 text-neutral-500">Restaurant</td>
                                            <td className="p-4 text-neutral-500">{row.address || 'No Address'}</td>
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
                                ) : drivers.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-neutral-500 font-bold">No records found.</td></tr>
                                ) : (
                                    drivers.map(row => (
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
                                ) : transports.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-neutral-500 font-bold">No records found.</td></tr>
                                ) : (
                                    transports.map(row => (
                                        <tr key={row.id} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="p-4 pl-6 font-bold">{row.name}</td>
                                            <td className="p-4 text-neutral-500">Transport Provider</td>
                                            <td className="p-4 text-neutral-500">{(row.transport_vehicles || []).map(v => v.vehicle_type).join(', ') || 'Various'}</td>
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
                                ) : guides.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-neutral-500 font-bold">No records found.</td></tr>
                                ) : (
                                    guides.map(row => (
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
                    {/* Pagination Footer */}
                    <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
                        <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-2">
                            Showing {Math.min(totalCount, currentPage * pageSize + 1)} to {Math.min(totalCount, (currentPage + 1) * pageSize)} of {totalCount} records
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                                className="p-2 rounded-lg hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    // Simple sliding window for page numbers
                                    let pageNum = i;
                                    if (totalPages > 5) {
                                        if (currentPage > 2) pageNum = currentPage - 2 + i;
                                        if (pageNum >= totalPages) pageNum = totalPages - 5 + i;
                                        if (pageNum < 0) pageNum = i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === pageNum ? 'bg-brand-green text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-200'}`}
                                        >
                                            {pageNum + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={currentPage >= totalPages - 1}
                                className="p-2 rounded-lg hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 pr-2">
                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Rows per page:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(0);
                                }}
                                className="bg-transparent text-xs font-bold text-neutral-600 outline-none cursor-pointer"
                            >
                                {[10, 25, 50, 100].map(size => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <HotelFormModal
                isOpen={isHotelModalOpen}
                onClose={() => setIsHotelModalOpen(false)}
                hotel={selectedHotel}
                onSave={loadData}
                userRole={userRole}
            />
            <VendorFormModal
                isOpen={isVendorModalOpen}
                onClose={() => setIsVendorModalOpen(false)}
                vendor={selectedVendor}
                onSave={loadData}
                userRole={userRole}
            />
            <DriverFormModal
                isOpen={isDriverModalOpen}
                onClose={() => setIsDriverModalOpen(false)}
                driver={selectedDriver}
                onSave={loadData}
                userRole={userRole}
            />
            <TourGuideFormModal
                isOpen={isGuideModalOpen}
                onClose={() => setIsGuideModalOpen(false)}
                guide={selectedGuide}
                onSave={loadData}
                userRole={userRole}
            />
            <TransportProviderFormModal
                isOpen={isTransportModalOpen}
                onClose={() => setIsTransportModalOpen(false)}
                provider={selectedTransport}
                onSave={loadData}
                userRole={userRole}
            />
            <RestaurantFormModal
                isOpen={isRestaurantModalOpen}
                onClose={() => setIsRestaurantModalOpen(false)}
                restaurant={selectedRestaurant}
                onSave={loadData}
                userRole={userRole}
            />
            <ApprovalReviewModal
                isOpen={isApprovalModalOpen}
                onClose={() => setIsApprovalModalOpen(false)}
                request={selectedApproval}
                onResolved={() => {
                    loadData();
                    // Optionally refresh other tabs data if we switch
                }}
            />
        </div>
    );
}
