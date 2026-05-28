import VIPContent from "./VIPContent";
import { Metadata } from "next";
import MainLayout from "@/components/layout/MainLayout";
import { headers } from "next/headers";
import { getDictionary } from "@/dictionaries";
import { I18nProvider } from "@/components/I18nProvider";

export const metadata: Metadata = {
    title: "VIP Experiences & Luxury Travel Sri Lanka | Nilathra Collection",
    description: "Discover curated VIP travel experiences in Sri Lanka. Tailor-made ultra-luxury itineraries, private aviation, elite wellness, and exclusive villa retreats.",
    alternates: {
        canonical: "https://www.nilathra.com/for-vip",
    },
    openGraph: {
        title: "VIP Experiences & Luxury Travel Sri Lanka | Nilathra Collection",
        description: "Discover curated VIP travel experiences in Sri Lanka. Tailor-made ultra-luxury itineraries, private aviation, elite wellness, and exclusive villa retreats.",
        url: "https://www.nilathra.com/for-vip",
        siteName: "Nilathra Collection",
        type: "website",
    },
};

export default async function VIPPage() {
    const headersList = await headers();
    const locale = headersList.get('x-locale') || 'en';
    const dict = await getDictionary(locale);

    return (
        <I18nProvider dictionary={dict}>
            <MainLayout>
                <main className="min-h-screen bg-neutral-900 text-white selection:bg-brand-gold selection:text-black">
                    <VIPContent />
                </main>
            </MainLayout>
        </I18nProvider>
    );
}
