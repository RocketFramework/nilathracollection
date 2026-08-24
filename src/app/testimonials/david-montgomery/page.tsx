import DavidMontgomeryClient from "./DavidMontgomeryClient";
import { Metadata } from "next";
import MainLayout from "@/components/layout/MainLayout";
import { headers } from "next/headers";
import { getDictionary } from "@/dictionaries";
import { I18nProvider } from "@/components/I18nProvider";

export const metadata: Metadata = {
    title: "David Montgomery's Ultra VIP Experience | Nilathra Collection",
    description: "Read David Montgomery's authentic review of his 10-day Ceylon tea estate buyout, private helicopter safaris to Sigiriya and Yala, private chef, and Ayurvedic master, managed by Sonali.",
    alternates: {
        canonical: "https://www.nilathra.com/testimonials/david-montgomery",
    },
    openGraph: {
        title: "David Montgomery's Ultra VIP Experience | Nilathra Collection",
        description: "Read David Montgomery's authentic review of his 10-day Ceylon tea estate buyout, private helicopter safaris to Sigiriya and Yala, private chef, and Ayurvedic master, managed by Sonali.",
        url: "https://www.nilathra.com/testimonials/david-montgomery",
        siteName: "Nilathra Collection",
        images: [
            {
                url: "https://www.nilathra.com/images/david_montgomery_tea_estate.webp",
                width: 1200,
                height: 630,
                alt: "David Montgomery and family at Ceylon Tea Estate",
            },
        ],
        type: "article",
    },
};

export default async function DavidMontgomeryPage() {
    const headersList = await headers();
    const locale = headersList.get('x-locale') || 'en';
    const dict = await getDictionary(locale);

    return (
        <I18nProvider dictionary={dict}>
            <MainLayout>
                <DavidMontgomeryClient />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Review",
                            "itemReviewed": {
                                "@type": "TravelAgency",
                                "name": "Nilathra Collection",
                                "url": "https://www.nilathra.com"
                            },
                            "author": {
                                "@type": "Person",
                                "name": "David Montgomery"
                            },
                            "reviewRating": {
                                "@type": "Rating",
                                "ratingValue": "5",
                                "bestRating": "5"
                            },
                            "reviewBody": "From our private tea estate bungalow buyout near the factory to helicopter transfers for Sigiriya and Yala, every moment was handled seamlessly by Sonali maintaining ultra-luxury standards. All in all, it was an exceptionally well-organized trip.",
                            "publisher": {
                                "@type": "Organization",
                                "name": "Nilathra Collection"
                            }
                        }),
                    }}
                />
            </MainLayout>
        </I18nProvider>
    );
}
