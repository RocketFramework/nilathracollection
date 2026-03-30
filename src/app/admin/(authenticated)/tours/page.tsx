"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Calendar, User, Navigation, DollarSign } from "lucide-react";
import Link from "next/link";
import { getToursAction } from "@/actions/admin.actions";

export default function AdminToursPage() {
    const router = useRouter();

    const [tours, setTours] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalTours, setTotalTours] = useState(0);

    const [filters, setFilters] = useState({
        status: "",
        search: "",
    });

    const activeStatuses = ['Approved', 'Booking In Progress', 'Fully Confirmed', 'Documents Sent', 'Completed', 'Archived'];

    const fetchTours = async () => {
        setIsLoading(true);
        try {
            const statusesToFetch = filters.status ? [filters.status] : activeStatuses;
            const result = await getToursAction(statusesToFetch);

            if (result.success && result.tours) {
                let data = result.tours;

                if (filters.search) {
                    const lcSearch = filters.search.toLowerCase();
                    data = data.filter((t: any) => {
                        const touristName = (t.tourist?.tourist_profile?.[0]?.first_name ? `${t.tourist?.tourist_profile?.[0]?.first_name} ${t.tourist?.tourist_profile?.[0]?.last_name}` : t.title || '').toLowerCase();
                        return touristName.includes(lcSearch) || (t.title && t.title.toLowerCase().includes(lcSearch));
                    });
                }

                const mapped = data.map((tour: any) => {
                    const plannerData = tour.planner_data || {};
                    const touristEmail = tour.tourist?.email || tour.request?.email || plannerData.clientEmail || 'No Email';

                    let touristName = tour.tourist?.tourist_profile?.[0]?.first_name
                        ? `${tour.tourist.tourist_profile[0].first_name} ${tour.tourist.tourist_profile[0].last_name || ''}`.trim()
                        : plannerData.clientName && plannerData.clientName !== touristEmail
                            ? plannerData.clientName
                            : 'Client';

                    if (touristName.startsWith('Custom Tour - ')) {
                        touristName = touristName.replace('Custom Tour - ', '').trim();
                    }
                    if (touristName === touristEmail) {
                        touristName = 'Client';
                    }

                    let displayTitle = tour.title || 'Custom Tour';
                    if (displayTitle.startsWith('Custom Tour - ') || displayTitle === touristEmail || displayTitle === touristName) {
                        displayTitle = 'Custom Tour';
                    }

                    const adminProf = tour.agent?.admin_profile?.[0];
                    const agentProf = tour.agent?.agent_profile?.[0];
                    const agentName = adminProf?.first_name
                        ? `${adminProf.first_name} ${adminProf.last_name || ''}`.trim()
                        : agentProf?.first_name
                            ? `${agentProf.first_name} ${agentProf.last_name || ''}`.trim()
                            : 'Unassigned';
                    const isArchived = tour.status === 'Archived';
                    const isCompleted = tour.status === 'Completed';

                    return {
                        id: tour.id,
                        touristName,
                        clientEmail: touristEmail,
                        title: displayTitle,
                        status: tour.status,
                        startDate: tour.start_date || plannerData.profile?.arrivalDate,
                        endDate: tour.end_date || plannerData.profile?.departureDate,
                        budget: plannerData.financials?.sellingPrice || tour.request?.budget || 0,
                        totalActivities: tour.total_activities || 0,
                        totalCities: tour.total_cities || 0,
                        totalKm: tour.total_km || 0,
                        agentName,
                        isArchived,
                        isCompleted
                    };
                });

                setTours(mapped);
                setTotalTours(mapped.length);
            }
        } catch (error) {
            console.error("Failed to load tours:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTours();
    }, [filters.status]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        fetchTours();
    };

    const clearFilters = () => {
        setFilters({ status: "", search: "" });
        setTimeout(() => fetchTours(), 0);
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
                        Tours & Trips
                    </h1>
                    <p className="text-[#6B7280] mt-1">Manage approved, ongoing, completed, and archived tours.</p>
                </div>
            </div>

            <div className="flex flex-col gap-6 w-full">
                {/* Top Filters Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-5">
                    <div className="flex items-center gap-2 mb-4 text-brand-charcoal font-bold text-sm">
                        <Filter size={16} />
                        <h2>Filter Tours</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        {/* Status Filter */}
                        <div>
                            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Status</label>
                            <select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                            >
                                <option value="">All Active Statuses</option>
                                {activeStatuses.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        {/* Search Filter */}
                        <div className="lg:col-span-2">
                            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Search Tourist / Title</label>
                            <div className="relative">
                                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input
                                    type="text"
                                    name="search"
                                    value={filters.search}
                                    onChange={handleFilterChange}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                    placeholder="Search name..."
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-brand-gold"
                                />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2 h-fit">
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

                {/* Main Tours List */}
                <div className="w-full bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                        <h2 className="text-xl font-bold font-playfair text-[#2B2B2B]">
                            {isLoading ? 'Loading Tours...' : `${totalTours} Tour${totalTours !== 1 ? 's' : ''} Found`}
                        </h2>
                    </div>

                    <div className="divide-y divide-neutral-100 flex-1">
                        {isLoading ? (
                            <div className="p-12 flex justify-center text-brand-gold">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div>
                            </div>
                        ) : tours.length === 0 ? (
                            <div className="p-16 flex flex-col items-center justify-center text-neutral-400">
                                <Navigation size={48} className="mb-4 opacity-50" />
                                <h3 className="text-lg font-bold text-brand-charcoal mb-2">No Tours Found</h3>
                                <p className="text-sm text-center">Try adjusting your filters or checking a different status.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-[#F9FAFB] text-[#6B7280] uppercase tracking-wider text-[11px] font-bold border-b border-[#E5E7EB]">
                                        <tr>
                                            <th className="px-6 py-4">Tour & Client</th>
                                            <th className="px-6 py-4">Status & Agent</th>
                                            <th className="px-6 py-4">Dates</th>
                                            <th className="px-6 py-4">Metrics</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E5E7EB]">
                                        {tours.map((tour) => (
                                            <tr
                                                key={tour.id}
                                                className={`transition-colors cursor-pointer group ${tour.isArchived ? 'bg-neutral-50 opacity-80' : 'hover:bg-neutral-50/50'}`}
                                                onClick={() => router.push(`/admin/tours/${tour.id}`)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border shrink-0 ${tour.isCompleted || tour.isArchived ? 'bg-neutral-200 text-neutral-500 border-neutral-300' : 'bg-brand-gold/10 text-brand-gold border-brand-gold/30'}`}>
                                                            {tour.touristName ? tour.touristName.charAt(0).toUpperCase() : '?'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-brand-charcoal text-[14px]">
                                                                {tour.touristName} {tour.isArchived && <span className="text-[10px] bg-neutral-200 px-1.5 py-0.5 rounded text-neutral-600 ml-2">(Archived)</span>}
                                                            </p>
                                                            <div className="text-xs text-neutral-500 flex flex-col gap-0.5 mt-0.5">
                                                                <span className="truncate max-w-[200px] text-brand-gold">{tour.clientEmail}</span>
                                                                {tour.title !== 'Custom Tour' && <span className="truncate max-w-[200px]">{tour.title}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-2 items-start">
                                                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                                            ${tour.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                                                                tour.status === 'Booking In Progress' ? 'bg-yellow-100 text-yellow-700' :
                                                                    (tour.status === 'Completed' || tour.status === 'Fully Confirmed' || tour.status === 'Documents Sent') ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-700'
                                                            }`}>
                                                            {tour.status}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs text-brand-charcoal font-medium">
                                                            <User size={14} className="text-neutral-400 shrink-0" />
                                                            <span className="truncate max-w-[150px]">{tour.agentName}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-600">
                                                            <Calendar size={12} className="shrink-0" />
                                                            <span>From: <span className="font-medium text-brand-charcoal">{tour.startDate ? new Date(tour.startDate).toLocaleDateString() : 'TBD'}</span></span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-600">
                                                            <Calendar size={12} className="shrink-0" />
                                                            <span>To: <span className="font-medium text-brand-charcoal">{tour.endDate ? new Date(tour.endDate).toLocaleDateString() : 'TBD'}</span></span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative group/tooltip flex items-center justify-center w-auto px-2 h-8 rounded-full bg-brand-green/10 text-brand-green border border-brand-green/20">
                                                            <DollarSign size={14} className="mr-1" />
                                                            <span className="font-bold text-[11px]">{tour.budget?.toLocaleString() || '0'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                                                            <div className="flex flex-col items-center bg-neutral-50 px-2 py-1 rounded border min-w-[36px]">
                                                                <span className="font-bold text-brand-charcoal">{tour.totalCities}</span>
                                                                <span className="text-[8px] uppercase">Cities</span>
                                                            </div>
                                                            <div className="flex flex-col items-center bg-neutral-50 px-2 py-1 rounded border min-w-[36px]">
                                                                <span className="font-bold text-brand-charcoal">{tour.totalActivities}</span>
                                                                <span className="text-[8px] uppercase">Act</span>
                                                            </div>
                                                            <div className="flex flex-col items-center bg-neutral-50 px-2 py-1 rounded border min-w-[36px]">
                                                                <span className="font-bold text-brand-charcoal">{tour.totalKm}</span>
                                                                <span className="text-[8px] uppercase">km</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        className="text-[11px] font-bold uppercase tracking-wider bg-white border border-neutral-200 text-neutral-600 px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors inline-block"
                                                        onClick={(e) => { e.stopPropagation(); router.push(`/admin/tours/${tour.id}`); }}
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
