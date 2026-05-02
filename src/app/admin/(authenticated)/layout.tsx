import { ReactNode } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, Settings, LogOut, Package, Compass, MapPin, Database, UserPlus, Navigation, Mail } from "lucide-react";
import { logoutAction } from "../../actions/auth";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let isAdmin = false;
    let userInitials = "NC";
    let displayRole = "Guest";

    if (user) {
        // Broad check for admin using service role client to bypass any RLS read restrictions
        const adminSupabase = createAdminClient();
        const { data: rpcRole } = await adminSupabase.rpc('get_user_role', { user_id: user.id });
        const { data: adminData } = await adminSupabase.from('admin_profiles').select('*').eq('id', user.id).single();
        const metadataRole = user.user_metadata?.role;

        const isRpcAdmin = typeof rpcRole === 'string'
            ? rpcRole.trim().toLowerCase() === 'admin'
            : typeof rpcRole === 'object' && rpcRole !== null && (rpcRole as any).role === 'admin';

        if (isRpcAdmin || adminData || metadataRole === 'admin') {
            isAdmin = true;
            displayRole = "Admin";
            userInitials = adminData?.first_name ? adminData.first_name.substring(0, 2).toUpperCase() : "AD";
        } else {
            // Retrieve agent info for initials
            const { data: agentData } = await adminSupabase.from('agent_profiles').select('*').eq('id', user.id).single();
            if (agentData && agentData.first_name) {
                userInitials = agentData.first_name.substring(0, 2).toUpperCase();
                displayRole = "Agent";
            }
        }
    }

    return (
        <div className="flex h-screen bg-[#F5F3EF] text-[#2B2B2B] font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col shadow-sm hidden md:flex z-20 relative">
                <div className="p-6 border-b border-[#E5E7EB]">
                    <h2 className="text-2xl font-bold tracking-wider uppercase font-playfair text-[#2B2B2B]">Nilathra</h2>
                    <p className="text-xs text-[#6B7280] uppercase tracking-widest mt-1">Admin Portal</p>
                </div>
                <nav className="flex-1 py-6 space-y-2 overflow-y-auto">
                    <Link href="/admin" className="flex items-center gap-4 px-6 py-3 text-[#4B5563] hover:bg-[#F5F3EF] hover:text-[#2B2B2B] transition-colors rounded-r-full mr-4 group">
                        <LayoutDashboard size={20} className="text-[#6B7280] group-hover:text-[#D4AF37] transition-colors" />
                        <span className="font-medium tracking-wide">Dashboard</span>
                    </Link>
                    <Link href="/admin/requests" className="flex items-center gap-4 px-6 py-3 text-[#4B5563] hover:bg-[#F5F3EF] hover:text-[#2B2B2B] transition-colors rounded-r-full mr-4 group">
                        <MapPin size={20} className="text-[#6B7280] group-hover:text-[#D4AF37] transition-colors" />
                        <span className="font-medium tracking-wide">Requests</span>
                    </Link>
                    <Link href="/admin/planner" className="flex items-center gap-4 px-6 py-3 text-[#4B5563] hover:bg-[#F5F3EF] hover:text-[#2B2B2B] transition-colors rounded-r-full mr-4 group">
                        <Compass size={20} className="text-[#6B7280] group-hover:text-[#D4AF37] transition-colors" />
                        <span className="font-medium tracking-wide">Trip Planner</span>
                    </Link>
                    <Link href="/admin/tours" className="flex items-center gap-4 px-6 py-3 text-[#4B5563] hover:bg-[#F5F3EF] hover:text-[#2B2B2B] transition-colors rounded-r-full mr-4 group">
                        <Navigation size={20} className="text-[#6B7280] group-hover:text-[#D4AF37] transition-colors" />
                        <span className="font-medium tracking-wide">Tours</span>
                    </Link>
                    <Link href="/admin/packages" className="flex items-center gap-4 px-6 py-3 text-[#4B5563] hover:bg-[#F5F3EF] hover:text-[#2B2B2B] transition-colors rounded-r-full mr-4 group">
                        <Package size={20} className="text-[#6B7280] group-hover:text-[#D4AF37] transition-colors" />
                        <span className="font-medium tracking-wide">Packages</span>
                    </Link>
                    <Link href="/admin/emails" className="flex items-center gap-4 px-6 py-3 text-[#4B5563] hover:bg-[#F5F3EF] hover:text-[#2B2B2B] transition-colors rounded-r-full mr-4 group">
                        <Mail size={20} className="text-[#6B7280] group-hover:text-[#D4AF37] transition-colors" />
                        <span className="font-medium tracking-wide">Send Email</span>
                    </Link>

                    {isAdmin && (
                        <>
                            <Link href="/admin/user-management" className="flex items-center gap-4 px-6 py-3 text-[#4B5563] hover:bg-[#F5F3EF] hover:text-[#2B2B2B] transition-colors rounded-r-full mr-4 group">
                                <Users size={20} className="text-[#6B7280] group-hover:text-[#D4AF37] transition-colors" />
                                <span className="font-medium tracking-wide">Users</span>
                            </Link>
                            <Link href="/admin/users/create-agent" className="flex items-center gap-4 px-6 py-3 text-[#4B5563] hover:bg-[#F5F3EF] hover:text-[#2B2B2B] transition-colors rounded-r-full mr-4 group">
                                <UserPlus size={20} className="text-[#6B7280] group-hover:text-[#D4AF37] transition-colors" />
                                <span className="font-medium tracking-wide">Create Agent</span>
                            </Link>
                        </>
                    )}

                    <Link href="/admin/master-data" className="flex items-center gap-4 px-6 py-3 text-[#4B5563] hover:bg-[#F5F3EF] hover:text-[#2B2B2B] transition-colors rounded-r-full mr-4 group">
                        <Database size={20} className="text-[#6B7280] group-hover:text-[#D4AF37] transition-colors" />
                        <span className="font-medium tracking-wide">Master Data</span>
                    </Link>

                    {isAdmin && (
                        <>
                            <Link href="/admin/logs" className="flex items-center gap-4 px-6 py-3 text-[#4B5563] hover:bg-[#F5F3EF] hover:text-[#2B2B2B] transition-colors rounded-r-full mr-4 group">
                                <Database size={20} className="text-[#6B7280] group-hover:text-[#D4AF37] transition-colors" />
                                <span className="font-medium tracking-wide">System Logs</span>
                            </Link>
                            <Link href="/admin/settings" className="flex items-center gap-4 px-6 py-3 text-[#4B5563] hover:bg-[#F5F3EF] hover:text-[#2B2B2B] transition-colors rounded-r-full mr-4 group">
                                <Settings size={20} className="text-[#6B7280] group-hover:text-[#D4AF37] transition-colors" />
                                <span className="font-medium tracking-wide">Settings</span>
                            </Link>
                        </>
                    )}
                </nav>
                <div className="p-6 border-t border-[#E5E7EB]">
                    <form action={logoutAction}>
                        <button type="submit" className="flex items-center gap-3 px-4 py-2 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">
                            <LogOut size={20} />
                            <span>Logout</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Top Header */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-[#E5E7EB] flex items-center px-8 justify-between shrink-0 shadow-sm z-10">
                    <h1 className="text-xl font-semibold text-[#2B2B2B] font-playfair tracking-wide flex-shrink-0">Admin Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end mr-2">
                            <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">{displayRole}</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[#2B2B2B] flex items-center justify-center text-[#D4AF37] font-bold text-sm shadow-md">
                            {userInitials}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto bg-[#F5F3EF]">
                    <div className="h-full w-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
