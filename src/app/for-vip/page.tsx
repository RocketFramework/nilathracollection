import VIPContent from "./VIPContent";
import { Metadata } from "next";
import MainLayout from "@/components/layout/MainLayout";
import { headers } from "next/headers";
import { getDictionary } from "@/dictionaries";
import { I18nProvider } from "@/components/I18nProvider";
export const metadata: Metadata = {
    title: "VIP Tour Packages from Sri Lanka | Exclusive Luxury Travel",
    description: "Experience Thabrobana: The ultimate luxury travel destination. A land like no other.",
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
