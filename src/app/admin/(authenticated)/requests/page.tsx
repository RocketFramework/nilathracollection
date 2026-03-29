"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, MapPin, Search, Filter, Phone, Calendar, DollarSign, Plane, User, Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { UserService } from "@/services/user.service";
import { createTourAction } from "@/actions/admin.actions";

export default function AdminRequests() {
    const [userRole, setUserRole] = useState<'admin' | 'agent' | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const router = useRouter();

    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatingTour, setIsCreatingTour] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRequests, setTotalRequests] = useState(0);
    const pageSize = 10;

    const handleCreateTour = async (requestId: string) => {
        setIsCreatingTour(requestId);
        try {
            const res = await createTourAction(requestId);
            if (res.success && res.tourId) {
                router.push(`/admin/planner?tourId=${res.tourId}`);
            } else {
                alert(res.error || 'Failed to open trip planner.');
            }
        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Failed to open trip planner.');
        } finally {
            setIsCreatingTour(null);
        }
    };

    const [filters, setFilters] = useState({
        status: "",
        dateFrom: "",
        dateTo: "",
        email: "",
        adminAssignedTo: "",
        nightsOperator: "Higher than" as "Higher than" | "Lower than",
        nightsValue: "" as string | number,
    });

    useEffect(() => {
        UserService.getCurrentUserProfile().then(p => {
            setUserRole(p?.role as any || 'agent');
            setUserId(p?.id || null);
        });
    }, []);

    const fetchRequests = async () => {
        if (!userRole || !userId) return; // Wait for auth constraints
        setIsLoading(true);
        try {
            const { RequestService } = await import('@/services/request.service');

            // Format filters for API
            const apiFilters: any = {
                ...filters,
                nightsValue: filters.nightsValue !== "" ? Number(filters.nightsValue) : undefined,
                status: filters.status || undefined,
                dateFrom: filters.dateFrom || undefined,
                dateTo: filters.dateTo || undefined,
                email: filters.email || undefined,
                nightsOperator: filters.nightsOperator
            };

            // Enforce Agent assignment restriction
            if (userRole === 'agent') {
                apiFilters.adminAssignedTo = userId;
            } else {
                apiFilters.adminAssignedTo = filters.adminAssignedTo || undefined;
            }

            const { data, count } = await RequestService.getRequestsWithFilters(apiFilters, currentPage, pageSize);

            // Map database format to UI format
            if (data) {
                const mapped = data.map((req: any) => {
                    const touristName = req.tourist_profile?.[0]?.first_name && req.tourist_profile?.[0]?.last_name
                        ? `${req.tourist_profile[0].first_name} ${req.tourist_profile[0].last_name}`
                        : req.email || 'Anonymous';

                    const dests = req.details?.[0]?.destinations || [];
                    const packageName = req.details?.[0]?.package_name || req.request_type;
                    const nights = req.details?.[0]?.nights || 0;

                    return {
                        id: req.id,
                        type: req.request_type === 'package' ? packageName : 'Custom Plan',
                        touristName: touristName,
                        email: req.email,
                        phone_number: req.phone_number,
                        country: req.departure_country,
                        budget: req.budget || req.details?.[0]?.estimated_price,
                        startDate: req.start_date || req.details?.[0]?.start_date,
                        durationNights: req.duration_nights || req.details?.[0]?.nights || 0,
                        adults: req.adults || req.details?.[0]?.adults || 0,
                        children: req.children || req.details?.[0]?.children || 0,
                        infants: req.infants || 0,
                        status: req.status,
                        destinations: Array.isArray(dests) ? dests : [dests].filter(Boolean),
                        assignedTo: req.admin_assigned_to ? 'Assigned' : 'Unassigned',
                        date: new Date(req.created_at).toLocaleDateString(),
                        time: new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                });
                setRequests(mapped);
                setTotalPages(Math.ceil((count || 0) / pageSize) || 1);
                setTotalRequests(count || 0);
            }
        } catch (error) {
            console.error("Failed to load requests:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [currentPage, userRole, userId]);

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(c => c + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(c => c - 1);
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        setCurrentPage(1); // Reset to page 1 on new filter
        setTimeout(() => fetchRequests(), 0);
    };

    const clearFilters = () => {
        setFilters({
            status: "",
            dateFrom: "",
            dateTo: "",
            email: "",
            adminAssignedTo: "",
            nightsOperator: "Higher than",
            nightsValue: "",
        });
        setCurrentPage(1); // Reset to page 1
        setTimeout(() => fetchRequests(), 0);
    };

    return (
        <div className="max-w-7xl mx-auto p-10 animate-in fade-in duration-500">

            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3">
                        <Link href="/admin" className="text-sm text-neutral-500 hover:text-brand-charcoal transition-colors">
                            &larr; Back to Dashboard
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold font-playfair text-[#2B2B2B] mt-2">
                        All Requests
                    </h1>
                    <p className="text-[#6B7280] mt-1">Manage and filter all incoming travel requests.</p>
                </div>
            </div>

            <div className="flex flex-col gap-6 w-full">
                {/* Top Filters Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-5">
                    <div className="flex items-center gap-2 mb-4 text-brand-charcoal font-bold text-sm">
                        <Filter size={16} />
                        <h2>Filter Requests</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 items-end">
                        {/* Status Filter */}
                        <div className="xl:col-span-1">
                            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Status</label>
                            <select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                            >
                                <option value="">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Assigned">Assigned</option>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>

                        {/* Date Filter */}
                        <div className="lg:col-span-2">
                            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Date Submitted (From - To)</label>
                            <div className="flex items-center justify-between gap-2">
                                <input
                                    type="date"
                                    name="dateFrom"
                                    value={filters.dateFrom}
                                    onChange={handleFilterChange}
                                    className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-brand-gold"
                                />
                                <span className="text-neutral-300 text-xs">-</span>
                                <input
                                    type="date"
                                    name="dateTo"
                                    value={filters.dateTo}
                                    onChange={handleFilterChange}
                                    className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-brand-gold"
                                />
                            </div>
                        </div>

                        {/* Email Filter */}
                        <div className="xl:col-span-1">
                            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Tourist Email</label>
                            <div className="relative">
                                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input
                                    type="text"
                                    name="email"
                                    value={filters.email}
                                    onChange={handleFilterChange}
                                    placeholder="Search email..."
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-brand-gold"
                                />
                            </div>
                        </div>

                        {/* Nights Filter */}
                        <div className="xl:col-span-1">
                            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Duration</label>
                            <div className="flex gap-1">
                                <select
                                    name="nightsOperator"
                                    value={filters.nightsOperator}
                                    onChange={handleFilterChange}
                                    className="w-[50px] bg-neutral-50 border border-neutral-200 rounded-l-lg px-1 py-2 text-xs focus:outline-none focus:border-brand-gold"
                                >
                                    <option value="Higher than">&gt;=</option>
                                    <option value="Lower than">&lt;=</option>
                                </select>
                                <input
                                    type="number"
                                    name="nightsValue"
                                    value={filters.nightsValue}
                                    onChange={handleFilterChange}
                                    placeholder="Nights"
                                    className="w-full bg-neutral-50 border border-neutral-200 border-l-0 rounded-r-lg px-2 py-2 text-xs focus:outline-none focus:border-brand-gold"
                                />
                            </div>
                        </div>

                        {/* Admin Assigned To Filter (Admin Only) */}
                        <div className="xl:col-span-1">
                            {userRole === 'admin' ? (
                                <div>
                                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Assigned Agent</label>
                                    <select
                                        name="adminAssignedTo"
                                        value={filters.adminAssignedTo}
                                        onChange={handleFilterChange}
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-brand-gold overflow-hidden text-ellipsis"
                                    >
                                        <option value="">Any Agent</option>
                                        <option value="unassigned">Unassigned Only</option>
                                    </select>
                                </div>
                            ) : (
                                <div className="hidden"></div>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2 h-fit xl:col-span-1">
                            <button
                                onClick={applyFilters}
                                className="flex-1 font-bold text-xs bg-brand-charcoal text-white py-2.5 rounded-lg hover:bg-neutral-800 transition-colors shadow-sm"
                            >
                                Apply
                            </button>
                            <button
                                onClick={clearFilters}
                                className="flex-1 font-bold text-xs bg-neutral-100 text-neutral-600 py-2.5 rounded-lg hover:bg-neutral-200 transition-colors border border-neutral-200 shadow-sm"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Requests List */}
                <div className="w-full bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                        <h2 className="text-xl font-bold font-playfair text-[#2B2B2B]">
                            {isLoading ? 'Searching...' : `${totalRequests} Request${totalRequests !== 1 ? 's' : ''} Found`}
                        </h2>
                    </div>

                    <div className="divide-y divide-neutral-100 flex-1">
                        {isLoading ? (
                            <div className="p-12 flex justify-center text-brand-gold">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div>
                            </div>
                        ) : requests.length === 0 ? (
                            <div className="p-16 flex flex-col items-center justify-center text-neutral-400">
                                <Package size={48} className="mb-4 opacity-50" />
                                <h3 className="text-lg font-bold text-brand-charcoal mb-2">No Requests Found</h3>
                                <p className="text-sm text-center">Try adjusting your filters or clearing them to see more results.</p>
                                <button
                                    onClick={clearFilters}
                                    className="mt-4 px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-[#F9FAFB] text-[#6B7280] uppercase tracking-wider text-[11px] font-bold border-b border-[#E5E7EB]">
                                        <tr>
                                            <th className="px-6 py-4">Tourist & Contact</th>
                                            <th className="px-6 py-4">Status & Details</th>
                                            <th className="px-6 py-4">Dates</th>
                                            <th className="px-6 py-4">Requirements</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E5E7EB]">
                                        {requests.map((req) => (
                                            <tr
                                                key={req.id}
                                                className="hover:bg-neutral-50/50 transition-colors cursor-pointer group"
                                                onClick={() => router.push(`/admin/requests/${req.id}`)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center font-bold border border-brand-gold/30 shrink-0">
                                                            {req.touristName ? req.touristName.charAt(0).toUpperCase() : '?'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-brand-charcoal text-[14px]">{req.touristName}</p>
                                                            <div className="text-xs text-neutral-500 flex items-center gap-2 mt-0.5">
                                                                <span className="truncate max-w-[150px]">{req.email}</span>
                                                                {req.phone_number && (
                                                                    <span className="relative group/tooltip inline-flex items-center">
                                                                        <Phone size={14} className="text-brand-gold cursor-help" />
                                                                        <span className="absolute left-1/2 -top-10 -translate-x-1/2 bg-gray-900 text-white text-[11px] py-1.5 px-2.5 rounded shadow-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all whitespace-nowrap z-50 pointer-events-none before:content-[''] before:absolute before:-bottom-1 before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-gray-900">
                                                                            {req.phone_number}
                                                                        </span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-neutral-400 mt-0.5">from <span className="font-medium text-neutral-600">{req.country || 'Unknown'}</span></p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-2 items-start">
                                                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                                            ${req.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                req.status === 'Assigned' ? 'bg-blue-100 text-blue-700' :
                                                                    req.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-700'
                                                            }`}>
                                                            {req.status}
                                                        </div>
                                                        <div className="relative group/tooltip inline-flex items-center gap-1.5 text-xs text-brand-charcoal font-medium">
                                                            <Package size={14} className="text-neutral-400 shrink-0" />
                                                            <span className="truncate max-w-[150px]">{req.type}</span>
                                                            <span className="absolute left-1/2 -top-10 -translate-x-1/2 bg-gray-900 text-white text-[11px] py-1.5 px-2.5 rounded shadow-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all whitespace-nowrap z-50 pointer-events-none before:content-[''] before:absolute before:-bottom-1 before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-gray-900">
                                                                Requested: {req.type}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-1.5 text-xs">
                                                            <span className="font-semibold text-brand-charcoal">{req.date}</span>
                                                            <span className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">{req.time}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                                                            <Calendar size={12} className="shrink-0" />
                                                            <span>Start: <span className="font-medium text-neutral-700">{req.startDate ? new Date(req.startDate).toLocaleDateString() : 'Flexible'}</span></span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative group/tooltip flex items-center justify-center w-8 h-8 rounded-full bg-brand-green/10 text-brand-green cursor-help border border-brand-green/20">
                                                            <DollarSign size={16} />
                                                            <span className="absolute left-1/2 -top-10 -translate-x-1/2 bg-brand-green text-white font-bold text-[11px] py-1.5 px-2.5 rounded shadow-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all whitespace-nowrap z-50 pointer-events-none before:content-[''] before:absolute before:-bottom-1 before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-brand-green">
                                                                Budget: {req.budget ? `$${req.budget.toLocaleString()}` : 'Flexible / TBD'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs">
                                                            <div className="flex flex-col items-center justify-center bg-neutral-50 px-2 py-1 rounded border border-neutral-200 min-w-[36px]">
                                                                <span className="font-bold text-brand-charcoal">{req.durationNights || '?'}N</span>
                                                            </div>
                                                            <div className="flex flex-col items-center justify-center bg-neutral-50 px-2 py-1 rounded border border-neutral-200">
                                                                <div className="flex items-center gap-1 font-bold text-brand-charcoal">
                                                                    <User size={12} className="text-neutral-400" />
                                                                    <span>{req.adults}</span>
                                                                    {req.children > 0 && <span className="text-neutral-400 text-[10px] ml-0.5">+{req.children}c</span>}
                                                                    {req.infants > 0 && <span className="text-neutral-400 text-[10px] ml-0.5">+{req.infants}i</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {userRole === 'admin' && req.status === 'Pending' && (
                                                        <button
                                                            className="text-[11px] font-bold uppercase tracking-wider bg-brand-gold text-white px-4 py-2 rounded-lg shadow-sm hover:shadow hover:-translate-y-0.5 hover:bg-[#B3932F] transition-all"
                                                            onClick={(e) => { e.stopPropagation(); router.push(`/admin/requests/${req.id}`); }}
                                                        >
                                                            Assign Agent
                                                        </button>
                                                    )}
                                                    {(req.status === 'Assigned' || req.status === 'Active') && (
                                                        <button
                                                            disabled={isCreatingTour === req.id}
                                                            className="text-[11px] font-bold uppercase tracking-wider bg-brand-green text-white px-4 py-2 rounded-lg shadow-sm hover:shadow hover:-translate-y-0.5 hover:bg-green-800 transition-all flex items-center gap-2 ml-auto disabled:opacity-70 disabled:cursor-not-allowed"
                                                            onClick={(e) => { e.stopPropagation(); handleCreateTour(req.id); }}
                                                        >
                                                            {isCreatingTour === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                                            Open Trip Planner
                                                        </button>
                                                    )}
                                                    {(req.status !== 'Pending' && req.status !== 'Assigned' && req.status !== 'Active') && (
                                                        <button
                                                            className="text-[11px] font-bold uppercase tracking-wider bg-white border border-neutral-200 text-neutral-600 px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors inline-block"
                                                            onClick={(e) => { e.stopPropagation(); router.push(`/admin/requests/${req.id}`); }}
                                                        >
                                                            View
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {!isLoading && totalPages > 1 && (
                        <div className="p-4 border-t border-neutral-100 flex items-center justify-between bg-neutral-50 mt-auto">
                            <button
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                className="px-4 py-2 text-sm font-medium text-brand-charcoal bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-neutral-600 font-medium">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 text-sm font-medium text-brand-charcoal bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
