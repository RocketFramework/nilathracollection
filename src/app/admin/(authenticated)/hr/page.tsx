"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EmployeeHrWorkspace from "../components/EmployeeHrWorkspace";

export default function OfficeHrPage() {
    return (
        <div className="max-w-[1600px] mx-auto p-6 md:p-10 space-y-6 animate-in fade-in duration-500 pb-24">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
                        <Link
                            href="/admin"
                            className="inline-flex items-center gap-1 hover:text-[#2B2B2B] transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Dashboard
                        </Link>
                        <span>/</span>
                        <span className="text-[#D4AF37]">Office HR</span>
                    </div>
                    <h1 className="text-3xl font-bold font-playfair text-[#2B2B2B]">
                        Office HR &amp; Employee Management
                    </h1>
                    <p className="text-sm text-[#6B7280] mt-1">
                        Manage employee HR profiles, Annual / Casual / Sick leave requests &amp; hierarchical approvals, monthly remuneration, and commission settings.
                    </p>
                </div>
            </div>

            <EmployeeHrWorkspace fullPage />
        </div>
    );
}

