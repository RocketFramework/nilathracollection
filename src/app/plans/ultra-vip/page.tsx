"use client";

import MainLayout from "@/components/layout/MainLayout";
import UltraVIPPlan from "@/components/plans/UltraVIPPlan";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/components/I18nProvider";

export default function UltraVIPPage() {
    const t = useTranslation();
    const comp = t.plan_comparison || {};

    return (
        <MainLayout>
            <section className="pt-32 pb-24 px-6 md:px-12 bg-neutral-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <Link href="/plans" className="inline-flex items-center gap-2 text-brand-green hover:text-brand-gold transition-colors mb-8 font-medium">
                        <ArrowLeft size={16} /> {comp.back_to_plans || "Back to all plans"}
                    </Link>
                    <UltraVIPPlan />
                </div>
            </section>
        </MainLayout>
    );
}
