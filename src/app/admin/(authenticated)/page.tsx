"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Package, MapPin, TrendingUp, AlertTriangle, CheckCircle, Navigation, Phone, Calendar, DollarSign, Plane, User, Info } from "lucide-react";
import Link from "next/link";
import { UserService } from "@/services/user.service";

export default function AdminDashboard() {
    // In a real app, retrieve user role securely server-side or via context. Using state for mock implementation.
    const [userRole, setUserRole] = useState<'admin' | 'agent' | null>('admin');
    const router = useRouter();

    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        const fetchRequests = async () => {
            setIsLoading(true);
            try {
                // In production, this would use a secure server-side method if strictly for admins,
                // but for our prototype we can assume the admin is authenticated.
                const { RequestService } = await import('@/services/request.service');
                const { data, count } = await RequestService.getAllRequests(currentPage, pageSize);

                // Map database format to UI format
                if (data) {
                    const mapped = data.map((req: any) => {
                        const touristName = req.tourist_profile?.[0]?.first_name && req.tourist_profile?.[0]?.last_name
                            ? `${req.tourist_profile[0].first_name} ${req.tourist_profile[0].last_name}`
                            : req.name || req.email || 'Anonymous';

                        const dests = req.details?.[0]?.destinations || [];
                        const packageName = req.details?.[0]?.package_name || req.request_type;

                        return {
                            id: req.id,
                            type: req.request_type === 'package' ? packageName : 'Custom Plan',
                            touristName: touristName,
                            email: req.email,
                            phone_number: req.phone_number,
                            country: req.departure_country,
                            budget: req.budget || req.details?.[0]?.estimated_price,
                            startDate: req.start_date || req.details?.[0]?.start_date,
                            durationNights: req.duration_nights || req.details?.[0]?.nights,
                            adults: req.adults || 0,
                            children: req.children || 0,
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
                }
            } catch (error) {
                console.error("Failed to load requests:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRequests();
    }, [currentPage]);

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(c => c + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(c => c - 1);
    };

    const adminStats = [
        { label: "Total Users", value: "1,245", icon: Users, trend: "+12%" },
        { label: "Active Packages", value: "48", icon: Package, trend: "+3%" },
        { label: "Pending Requests", value: "12", icon: MapPin, trend: "0%" },
        { label: "Revenue", value: "$84,500", icon: TrendingUp, trend: "+18%" },
    ];

    const agentStats = [
        { label: "My Active Tours", value: "14", icon: Navigation, trend: "+2" },
        { label: "Pending Requests", value: "3", icon: MapPin, trend: "New" },
        { label: "Completed Tours", value: "42", icon: CheckCircle, trend: "" }
    ];

    const stats = userRole === 'admin' ? adminStats : agentStats;

    return (
        <div className="max-w-7xl mx-auto p-10 animate-in fade-in duration-500">
            {/* Quick role toggle for testing ONLY */}
            <div className="flex gap-2 mb-8 p-4 bg-brand-gold/10 border border-brand-gold/20 rounded-xl">
                <span className="text-sm font-bold text-brand-gold flex items-center mr-4">DEV TOGGLE:</span>
                <button onClick={() => setUserRole('admin')} className={`px-4 py-1 rounded text-sm font-bold ${userRole === 'admin' ? 'bg-brand-gold text-white' : 'bg-white text-brand-charcoal'}`}>Admin View</button>
                <button onClick={() => setUserRole('agent')} className={`px-4 py-1 rounded text-sm font-bold ${userRole === 'agent' ? 'bg-brand-gold text-white' : 'bg-white text-brand-charcoal'}`}>Agent View</button>
            </div>

            <div className="space-y-8 mt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold font-playfair text-[#2B2B2B]">
                            {userRole === 'admin' ? 'Master Dashboard' : 'Agent Workspace'}
                        </h1>
                        <p className="text-[#6B7280] mt-1">Welcome back. Here is what's happening with your operations today.</p>
                    </div>
                </div>
                <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-32">

                    {/* Top Stat Metrics */}
                    <MasterDashboardMetrics userRole={userRole} />

                    {/* Main Content Area - Split Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Left Column (Main Focus Area) */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Revenue Chart */}
                            <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6 hidden md:block">
                                <RevenueChart />
                            </div>
                        </div>

                        {/* Side Panel (Admin: Suspensions, Agent: Quick Links) */}
                        <div className="space-y-6">
                            {userRole === 'admin' ? (
                                <div className="bg-red-50/50 rounded-2xl shadow-sm border border-red-100 p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                    <h3 className="text-lg font-bold text-red-800 flex items-center gap-2 mb-4 relative z-10"><AlertTriangle size={18} /> Suspension Approvals</h3>
                                    <div className="space-y-3 relative z-10">
                                        <div className="p-4 bg-white rounded-xl border border-red-100 shadow-sm">
                                            <p className="text-sm font-bold text-brand-charcoal">The Grand Colombo</p>
                                            <p className="text-xs text-neutral-500 mt-1">Recommended by: Agent Samadhi</p>
                                            <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded italic">"Consistent negative feedback regarding service speeds."</p>
                                            <div className="flex gap-2 mt-3">
                                                <button className="flex-1 text-xs font-bold bg-red-600 text-white py-1.5 rounded-lg hover:bg-red-700 transition-colors">Approve</button>
                                                <button className="flex-1 text-xs font-bold bg-neutral-100 text-neutral-600 py-1.5 rounded-lg hover:bg-neutral-200 transition-colors">Reject</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6">
                                    <h3 className="text-lg font-bold text-brand-charcoal mb-4">Quick Actions</h3>
                                    <div className="space-y-2">
                                        <button className="w-full text-left px-4 py-3 bg-neutral-50 hover:bg-brand-green/5 hover:text-brand-green rounded-xl text-sm font-medium transition-colors border border-transparent hover:border-brand-green/20">
                                            Review Vendor Database
                                        </button>
                                        <button className="w-full text-left px-4 py-3 bg-neutral-50 hover:bg-brand-green/5 hover:text-brand-green rounded-xl text-sm font-medium transition-colors border border-transparent hover:border-brand-green/20">
                                            Submit Vendor Rating
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Access to Master Records for Admin */}
                            {userRole === 'admin' && (
                                <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6">
                                    <h3 className="text-lg font-bold text-brand-charcoal mb-4">Master Data Management</h3>
                                    <div className="space-y-2">
                                        <Link href="/admin/master-data" className="block w-full text-left px-4 py-3 bg-neutral-50 hover:bg-brand-green/5 hover:text-brand-green rounded-xl text-sm font-medium transition-colors border border-transparent hover:border-brand-green/20">
                                            Manage Hotels & Vendors
                                        </Link>
                                        <button className="w-full text-left px-4 py-3 bg-neutral-50 hover:bg-brand-green/5 hover:text-brand-green rounded-xl text-sm font-medium transition-colors border border-transparent hover:border-brand-green/20">
                                            Manage Staff Accounts
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>


                    {/* Pending Requests / Leads - Full Width */}
                    <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden mt-8">
                        <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between">
                            <h2 className="text-lg font-bold text-brand-charcoal">Recent Incoming Requests</h2>
                            <Link href="/admin/requests" className="text-sm font-bold text-brand-gold hover:text-[#B3932F] transition-colors">
                                View All Requests
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            {isLoading ? (
                                <div className="p-8 text-center text-neutral-500">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-gold mx-auto mb-3"></div>
                                    Loading requests...
                                </div>
                            ) : requests.length === 0 ? (
                                <div className="p-8 text-center text-neutral-500">
                                    <p>No requests found in the database.</p>
                                </div>
                            ) : (
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
                                                    {userRole === 'agent' && req.status === 'Assigned' && (
                                                        <button
                                                            className="text-[11px] font-bold uppercase tracking-wider bg-brand-green text-white px-4 py-2 rounded-lg shadow-sm hover:shadow hover:-translate-y-0.5 hover:bg-green-800 transition-all"
                                                            onClick={(e) => { e.stopPropagation(); /* TODO Build Itin Modal/Route */ }}
                                                        >
                                                            Build Itinerary
                                                        </button>
                                                    )}
                                                    {(req.status !== 'Pending' && req.status !== 'Assigned') && (
                                                        <button
                                                            className="text-[11px] font-bold uppercase tracking-wider bg-white border border-neutral-200 text-neutral-600 px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors"
                                                            onClick={(e) => { e.stopPropagation(); /* View Request */ }}
                                                        >
                                                            View
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-between items-center p-4 border-t border-neutral-200 bg-[#F9FAFB]">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 text-sm font-medium text-brand-charcoal bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-neutral-600 font-medium">Page {currentPage} of {totalPages}</span>
                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 text-sm font-medium text-brand-charcoal bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Dummy components for charts to resolve build errors
function MasterDashboardMetrics({ userRole }: { userRole: string | null }) {
    if (userRole !== 'admin') return null;
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-neutral-200">
                <p className="text-sm text-neutral-500">Revenue</p>
                <p className="font-bold text-xl">$124,500</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-neutral-200">
                <p className="text-sm text-neutral-500">Active Tours</p>
                <p className="font-bold text-xl">42</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-neutral-200">
                <p className="text-sm text-neutral-500">New Requests</p>
                <p className="font-bold text-xl">12</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-neutral-200">
                <p className="text-sm text-neutral-500">Conversion Rate</p>
                <p className="font-bold text-xl">68%</p>
            </div>
        </div>
    );
}

function RevenueChart() {
    return (
        <div className="h-64 flex flex-col items-center justify-center bg-neutral-50 rounded-lg">
            <p className="text-neutral-500 font-medium">Revenue Chart Area</p>
            <p className="text-xs text-neutral-400">Waiting for Data Visualization Library</p>
        </div>
    );
}
