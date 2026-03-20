import VIPContent from "./VIPContent";
import { Metadata } from "next";
import MainLayout from "@/components/layout/MainLayout";

export const metadata: Metadata = {
    title: "For VIP | Nilathra Collection",
    description: "Experience Thabrobana: The ultimate luxury travel destination. A land like no other.",
};

export default function VIPPage() {
    return (
        <MainLayout>
            <main className="min-h-screen bg-neutral-900 text-white selection:bg-brand-gold selection:text-black">
                <VIPContent />
            </main>
        </MainLayout>
    );
}
