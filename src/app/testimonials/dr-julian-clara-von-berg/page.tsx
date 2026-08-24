import DrJulianClaraClient from "./DrJulianClaraClient";
import { Metadata } from "next";
import MainLayout from "@/components/layout/MainLayout";
import { headers } from "next/headers";
import { getDictionary } from "@/dictionaries";
import { I18nProvider } from "@/components/I18nProvider";

export const metadata: Metadata = {
    title: "Dr. Julian & Clara Von Berg Twin-Island Review | Nilathra Collection",
    description: "Read Dr. Julian & Clara Von Berg's review of their twin-island luxury escape: 5 days at Hatton Ceylon Tea Trails with Nimali, private Ella train, morning kayaking, and 3 nights in Maldives with Ashee.",
    alternates: {
        canonical: "https://www.nilathra.com/testimonials/dr-julian-clara-von-berg",
    },
    openGraph: {
        title: "Dr. Julian & Clara Von Berg Twin-Island Review | Nilathra Collection",
        description: "Read Dr. Julian & Clara Von Berg's review of their twin-island luxury escape: 5 days at Hatton Ceylon Tea Trails with Nimali, private Ella train, morning kayaking, and 3 nights in Maldives with Ashee.",
        url: "https://www.nilathra.com/testimonials/dr-julian-clara-von-berg",
        siteName: "Nilathra Collection",
        images: [
            {
                url: "https://www.nilathra.com/images/dr_julian_clara_nimali.webp",
                width: 1200,
                height: 630,
                alt: "Dr. Julian & Clara Von Berg with Nimali at Hatton Ceylon Tea Trails",
            },
        ],
        type: "article",
    },
};

export default async function DrJulianClaraPage() {
    const headersList = await headers();
    const locale = headersList.get('x-locale') || 'en';
    const dict = await getDictionary(locale);

    return (
        <I18nProvider dictionary={dict}>
            <MainLayout>
                <DrJulianClaraClient />
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
                                "name": "Dr. Julian & Clara Von Berg"
                            },
                            "reviewRating": {
                                "@type": "Rating",
                                "ratingValue": "5",
                                "bestRating": "5"
                            },
                            "reviewBody": "German precision meets warm island sovereignty. The logistical seamlessness with which Nilathra arranged our twin-island escape between Ceylon's highlands and Maldives overwater sanctuaries set a new standard for luxury travel.",
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
