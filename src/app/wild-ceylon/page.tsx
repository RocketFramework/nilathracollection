import MainLayout from "@/components/layout/MainLayout";
import WildCeylonContent from "./WildCeylonContent";
import { Metadata } from "next";
import { headers } from "next/headers";
import { getDictionary } from "@/dictionaries";
import { I18nProvider } from "@/components/I18nProvider";

export const metadata: Metadata = {
    title: "Wild Ceylon Tour | Luxury Sri Lanka Wilderness & Wildlife | Nilathra Collection",
    description: "Explore the wild side of Sri Lanka on our 10-night/11-day luxury tour. From Sigiriya and hot air ballooning to leopards in Yala and a secluded beach villa.",
    alternates: {
        canonical: "https://www.nilathra.com/wild-ceylon",
    },
    openGraph: {
        title: "Wild Ceylon Tour | Luxury Sri Lanka Wilderness & Wildlife | Nilathra Collection",
        description: "Explore the wild side of Sri Lanka on our 10-night/11-day luxury tour. From Sigiriya and hot air ballooning to leopards in Yala and a secluded beach villa.",
        url: "https://www.nilathra.com/wild-ceylon",
        siteName: "Nilathra Collection",
        images: [
            {
                url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80",
                width: 1200,
                height: 630,
                alt: "Wild Ceylon Safari Tour",
            },
        ],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Wild Ceylon Tour | Luxury Sri Lanka Wilderness & Wildlife | Nilathra Collection",
        description: "Explore the wild side of Sri Lanka on our 10-night/11-day luxury tour with Nilathra Collection.",
        images: ["https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80"],
    },
};

export default async function WildCeylonPage() {
    const headersList = await headers();
    const locale = headersList.get('x-locale') || 'en';
    const dict = await getDictionary(locale);

    return (
        <I18nProvider dictionary={dict}>
            <MainLayout>
                <WildCeylonContent />
            </MainLayout>
        </I18nProvider>
    );
}
