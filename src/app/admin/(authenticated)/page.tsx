"use client";

import { useState, useEffect } from "react";
import { Users, Package, MapPin, TrendingUp, AlertTriangle, CheckCircle, Navigation } from "lucide-react";
import Link from "next/link";
import { UserService } from "@/services/user.service";

export default function AdminDashboard() {
    // In a real app, retrieve user role securely server-side or via context. Using state for mock implementation.
    const [userRole, setUserRole] = useState<'admin' | 'agent' | null>('admin');

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
                            : req.email || 'Anonymous';

                        const dests = req.details?.[0]?.destinations || [];
                        const packageName = req.details?.[0]?.package_name || req.request_type;

                        return {
                            id: req.id,
                            type: req.request_type === 'package' ? packageName : 'Custom Plan',
                            tourist: touristName,
                            status: req.status,
                            destinations: Array.isArray(dests) ? dests : [dests].filter(Boolean),
                            assignedTo: req.admin_assigned_to ? 'Assigned' : 'Unassigned',
                            date: new Date(req.created_at).toLocaleDateString()
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        const isPositive = stat.trend.startsWith("+");
                        return (
                            <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 rounded-xl bg-[#F5F3EF] flex items-center justify-center text-[#D4AF37]">
                                        <Icon size={24} />
                                    </div>
                                    <div className={`px-2.5 py-1 text-xs font-semibold rounded-full ${isPositive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {stat.trend}
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <h3 className="text-[#6B7280] text-sm font-medium">{stat.label}</h3>
                                    <p className="text-3xl font-bold text-[#2B2B2B] mt-1 font-playfair">{stat.value}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Main Requests List */}
                    <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold font-playfair text-[#2B2B2B]">
                                {userRole === 'admin' ? 'Recent Client Requests' : 'My Assigned Requests'}
                            </h2>
                            <div className="flex gap-2">
                                <Link href="/admin/requests" className="text-sm font-medium text-brand-green bg-brand-green/10 px-3 py-1.5 rounded-lg border border-brand-green/20 hover:bg-brand-green/20 transition-colors">View All Requests</Link>
                                <button className="text-sm font-medium text-neutral-500 hover:bg-neutral-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-neutral-200 transition-colors">Pending</button>
                            </div>
                        </div>

                        <div className="divide-y divide-neutral-100 flex-1">
                            {isLoading ? (
                                <div className="p-12 flex justify-center text-brand-gold">Loading requests...</div>
                            ) : requests.length === 0 ? (
                                <div className="p-12 flex flex-col items-center justify-center text-neutral-400">
                                    <Package size={48} className="mb-4 opacity-50" />
                                    <p>No requests found in the database.</p>
                                </div>
                            ) : requests.map(req => (
                                <div key={req.id} className="p-6 hover:bg-neutral-50 flex flex-col md:flex-row gap-4 items-center justify-between transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-brand-charcoal text-white flex items-center justify-center font-bold">
                                            {req.tourist ? req.tourist.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-brand-charcoal flex items-center gap-2">
                                                {req.tourist}
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${req.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                                    {req.status}
                                                </span>
                                            </h4>
                                            <p className="text-sm text-neutral-500">{req.type} &bull; {req.destinations.length > 0 ? req.destinations.join(', ') : req.date}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                                        {userRole === 'admin' && req.status === 'Pending' && (
                                            <button className="flex-1 md:flex-none text-xs font-bold uppercase tracking-wider bg-brand-gold text-white px-4 py-2 rounded-lg hover:bg-[#B3932F] transition-colors">
                                                Assign Agent
                                            </button>
                                        )}
                                        <Link href={`/admin/planner?reqId=${req.id}`} className="flex-1 md:flex-none text-xs font-bold uppercase tracking-wider bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-brand-charcoal transition-colors text-center shadow-md">
                                            Open Planner
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {!isLoading && totalPages > 1 && (
                            <div className="p-4 border-t border-neutral-100 flex items-center justify-between bg-neutral-50">
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
            </div>
        </div>
    );
}
