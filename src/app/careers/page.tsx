import MainLayout from "@/components/layout/MainLayout";
import CareersContent from "./CareersContent";
import { Metadata } from "next";
import { headers } from "next/headers";
import { getDictionary } from "@/dictionaries";
import { I18nProvider } from "@/components/I18nProvider";

export const metadata: Metadata = {
    title: "Careers | Join the Nilathra Collection Team",
    description: "Build a career in ultra-luxury travel. Explore career opportunities, vacancies, and roles at Nilathra Collection in Sri Lanka.",
    alternates: {
        canonical: "https://www.nilathra.com/careers",
    },
    openGraph: {
        title: "Careers | Join the Nilathra Collection Team",
        description: "Build a career in ultra-luxury travel. Explore career opportunities, vacancies, and roles at Nilathra Collection in Sri Lanka.",
        url: "https://www.nilathra.com/careers",
        siteName: "Nilathra Collection",
        images: [
            {
                url: "/images/luxury_resort_sunset.avif",
                width: 1200,
                height: 630,
                alt: "Join the Nilathra Collection Team",
            },
        ],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Careers | Join the Nilathra Collection Team",
        description: "Build a career in ultra-luxury travel. Explore career opportunities at Nilathra Collection in Sri Lanka.",
        images: ["/images/luxury_resort_sunset.avif"],
    },
};

export default async function CareersPage() {
    const headersList = await headers();
    const locale = headersList.get('x-locale') || 'en';
    const dict = await getDictionary(locale);

    return (
        <I18nProvider dictionary={dict}>
            <MainLayout>
                <CareersContent />
            </MainLayout>
        </I18nProvider>
    );
}
