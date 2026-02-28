import { ReactNode } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, Settings, LogOut, Package, Compass } from "lucide-react";
import { logoutAction } from "../../actions/auth";

export default function AdminLayout({ children }: { children: ReactNode }) {
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
                    <Link href="/admin/packages" className="flex items-center gap-4 px-6 py-3 text-[#4B5563] hover:bg-[#F5F3EF] hover:text-[#2B2B2B] transition-colors rounded-r-full mr-4 group">
                        <Package size={20} className="text-[#6B7280] group-hover:text-[#D4AF37] transition-colors" />
                        <span className="font-medium tracking-wide">Packages</span>
                    </Link>
                    <Link href="/admin/planner" className="flex items-center gap-4 px-6 py-3 text-[#4B5563] hover:bg-[#F5F3EF] hover:text-[#2B2B2B] transition-colors rounded-r-full mr-4 group">
                        <Compass size={20} className="text-[#6B7280] group-hover:text-[#D4AF37] transition-colors" />
                        <span className="font-medium tracking-wide">Trip Planner</span>
                    </Link>
                    <Link href="/admin/users" className="flex items-center gap-4 px-6 py-3 text-[#4B5563] hover:bg-[#F5F3EF] hover:text-[#2B2B2B] transition-colors rounded-r-full mr-4 group">
                        <Users size={20} className="text-[#6B7280] group-hover:text-[#D4AF37] transition-colors" />
                        <span className="font-medium tracking-wide">Users</span>
                    </Link>
                    <Link href="/admin/settings" className="flex items-center gap-4 px-6 py-3 text-[#4B5563] hover:bg-[#F5F3EF] hover:text-[#2B2B2B] transition-colors rounded-r-full mr-4 group">
                        <Settings size={20} className="text-[#6B7280] group-hover:text-[#D4AF37] transition-colors" />
                        <span className="font-medium tracking-wide">Settings</span>
                    </Link>
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
                        <div className="w-10 h-10 rounded-full bg-[#2B2B2B] flex items-center justify-center text-[#D4AF37] font-bold text-sm shadow-md">
                            NC
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
