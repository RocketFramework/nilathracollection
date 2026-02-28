"use client";

import { useState, useEffect } from "react";
import { Package, MapPin, Search, Filter } from "lucide-react";
import Link from "next/link";
import { UserService } from "@/services/user.service";

export default function AdminRequests() {
    // In a real app, retrieve user role securely server-side or via context. Using state for mock implementation.
    const [userRole, setUserRole] = useState<'admin' | 'agent' | null>('admin');

    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRequests, setTotalRequests] = useState(0);
    const pageSize = 10;

    const [filters, setFilters] = useState({
        status: "",
        dateFrom: "",
        dateTo: "",
        email: "",
        adminAssignedTo: "",
        nightsOperator: "Higher than" as "Higher than" | "Lower than",
        nightsValue: "" as string | number,
    });

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const { RequestService } = await import('@/services/request.service');

            // Format filters for API
            const apiFilters = {
                ...filters,
                nightsValue: filters.nightsValue !== "" ? Number(filters.nightsValue) : undefined,
                status: filters.status || undefined,
                dateFrom: filters.dateFrom || undefined,
                dateTo: filters.dateTo || undefined,
                email: filters.email || undefined,
                adminAssignedTo: filters.adminAssignedTo || undefined,
                nightsOperator: filters.nightsOperator
            };

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
                        tourist: touristName,
                        email: req.email,
                        status: req.status,
                        destinations: Array.isArray(dests) ? dests : [dests].filter(Boolean),
                        assignedTo: req.admin_assigned_to ? 'Assigned' : 'Unassigned',
                        date: new Date(req.created_at).toLocaleDateString(),
                        nights: nights
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
    }, [currentPage]);

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
            {/* Quick role toggle for testing ONLY */}
            <div className="flex gap-2 mb-8 p-4 bg-brand-gold/10 border border-brand-gold/20 rounded-xl">
                <span className="text-sm font-bold text-brand-gold flex items-center mr-4">DEV TOGGLE:</span>
                <button onClick={() => { setUserRole('admin'); setCurrentPage(1); fetchRequests(); }} className={`px-4 py-1 rounded text-sm font-bold ${userRole === 'admin' ? 'bg-brand-gold text-white' : 'bg-white text-brand-charcoal'}`}>Admin View</button>
                <button onClick={() => { setUserRole('agent'); setCurrentPage(1); fetchRequests(); }} className={`px-4 py-1 rounded text-sm font-bold ${userRole === 'agent' ? 'bg-brand-gold text-white' : 'bg-white text-brand-charcoal'}`}>Agent View</button>
            </div>

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

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Filters Sidebar */}
                <div className="xl:col-span-1 bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6 h-fit sticky top-6">
                    <div className="flex items-center gap-2 mb-6 text-brand-charcoal font-bold border-b border-neutral-100 pb-4">
                        <Filter size={20} />
                        <h2>Filters</h2>
                    </div>

                    <div className="space-y-5">
                        {/* Status Filter */}
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Status</label>
                            <select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
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
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Date Submitted</label>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="text-[10px] text-neutral-400 block mb-1">From</span>
                                    <input
                                        type="date"
                                        name="dateFrom"
                                        value={filters.dateFrom}
                                        onChange={handleFilterChange}
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-brand-gold"
                                    />
                                </div>
                                <div>
                                    <span className="text-[10px] text-neutral-400 block mb-1">To</span>
                                    <input
                                        type="date"
                                        name="dateTo"
                                        value={filters.dateTo}
                                        onChange={handleFilterChange}
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-brand-gold"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Email Filter */}
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Tourist Email</label>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input
                                    type="text"
                                    name="email"
                                    value={filters.email}
                                    onChange={handleFilterChange}
                                    placeholder="Search email..."
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
                                />
                            </div>
                        </div>

                        {/* Nights Filter */}
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Number of Nights</label>
                            <div className="flex gap-2">
                                <select
                                    name="nightsOperator"
                                    value={filters.nightsOperator}
                                    onChange={handleFilterChange}
                                    className="w-1/2 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-brand-gold"
                                >
                                    <option value="Higher than">&gt;=</option>
                                    <option value="Lower than">&lt;=</option>
                                </select>
                                <input
                                    type="number"
                                    name="nightsValue"
                                    value={filters.nightsValue}
                                    onChange={handleFilterChange}
                                    placeholder="e.g. 5"
                                    className="w-1/2 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
                                />
                            </div>
                        </div>

                        {/* Admin Assigned To Filter (Admin Only) */}
                        {userRole === 'admin' && (
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Assigned Agent</label>
                                <select
                                    name="adminAssignedTo"
                                    value={filters.adminAssignedTo}
                                    onChange={handleFilterChange}
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
                                >
                                    <option value="">Any Agent</option>
                                    <option value="unassigned">Unassigned Only</option>
                                    {/* In a real app we would map over a list of agent IDs/names here */}
                                </select>
                            </div>
                        )}

                        <div className="pt-4 border-t border-neutral-100 flex flex-col gap-2">
                            <button
                                onClick={applyFilters}
                                className="w-full font-bold text-sm bg-brand-charcoal text-white py-2.5 rounded-lg hover:bg-neutral-800 transition-colors"
                            >
                                Apply Filters
                            </button>
                            <button
                                onClick={clearFilters}
                                className="w-full font-bold text-sm bg-neutral-100 text-neutral-600 py-2.5 rounded-lg hover:bg-neutral-200 transition-colors"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Requests List */}
                <div className="xl:col-span-3 bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden flex flex-col">
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
                        ) : requests.map(req => (
                            <div key={req.id} className="p-6 hover:bg-neutral-50 flex flex-col md:flex-row gap-4 items-center justify-between transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-brand-charcoal text-white flex items-center justify-center font-bold text-lg">
                                        {req.tourist ? req.tourist.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-brand-charcoal flex items-center gap-2">
                                            {req.tourist}
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${req.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : req.status === 'Assigned' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                {req.status}
                                            </span>
                                            {userRole === 'admin' && (
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${req.assignedTo === 'Unassigned' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-neutral-100 text-neutral-700 border border-neutral-200'}`}>
                                                    {req.assignedTo}
                                                </span>
                                            )}
                                        </h4>
                                        <div className="text-sm text-neutral-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                            <span className="flex items-center gap-1"><MapPin size={12} /> {req.type}</span>
                                            {req.email && <span>&bull; {req.email}</span>}
                                            <span>&bull; {req.nights} Nights</span>
                                            <span>&bull; Submitted: {req.date}</span>
                                        </div>
                                        {req.destinations.length > 0 && (
                                            <div className="mt-2 flex gap-1 flex-wrap">
                                                {req.destinations.map((dest: string, i: number) => (
                                                    <span key={i} className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-1 rounded">
                                                        {dest}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                                    {userRole === 'admin' && req.status === 'Pending' && (
                                        <button className="flex-1 md:flex-none text-xs font-bold uppercase tracking-wider bg-brand-gold text-white px-4 py-2 rounded-lg hover:bg-[#B3932F] transition-colors shadow-sm">
                                            Assign
                                        </button>
                                    )}
                                    <Link href={`/admin/planner?reqId=${req.id}`} className="flex-1 md:flex-none text-xs font-bold uppercase tracking-wider bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-brand-charcoal transition-colors text-center shadow-md">
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        ))}
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
