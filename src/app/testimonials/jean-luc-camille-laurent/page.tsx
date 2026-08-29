import JeanLucCamilleClient from "./JeanLucCamilleClient";
import { Metadata } from "next";
import MainLayout from "@/components/layout/MainLayout";
import { headers } from "next/headers";
import { getDictionary } from "@/dictionaries";
import { I18nProvider } from "@/components/I18nProvider";

export const metadata: Metadata = {
    title: "Jean-Luc & Camille Laurent's Ultra VIP Experience | Nilathra Collection",
    description: "Read Jean-Luc & Camille Laurent's authentic review of their private villa buyout in Galle, bespoke private chef dining, and rare gem curations managed by Nimali.",
    alternates: {
        canonical: "https://www.nilathra.com/testimonials/jean-luc-camille-laurent",
    },
    openGraph: {
        title: "Jean-Luc & Camille Laurent's Ultra VIP Experience | Nilathra Collection",
        description: "Read Jean-Luc & Camille Laurent's authentic review of their private villa buyout in Galle, bespoke private chef dining, and rare gem curations managed by Nimali.",
        url: "https://www.nilathra.com/testimonials/jean-luc-camille-laurent",
        siteName: "Nilathra Collection",
        images: [
            {
                url: "https://www.nilathra.com/images/jean_luc_nimali.webp",
                width: 1200,
                height: 630,
                alt: "Jean-Luc & Camille Laurent with Nilathra personal travel manager Nimali",
            },
        ],
        type: "article",
    },
};

export default async function JeanLucCamillePage() {
    const headersList = await headers();
    const locale = headersList.get('x-locale') || 'en';
    const dict = await getDictionary(locale);

    return (
        <I18nProvider dictionary={dict}>
            <MainLayout>
                <JeanLucCamilleClient />
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
                                "name": "Jean-Luc & Camille Laurent"
                            },
                            "reviewRating": {
                                "@type": "Rating",
                                "ratingValue": "5",
                                "bestRating": "5"
                            },
                            "reviewBody": "An ultra-luxury experience defined by refined elegance and absolute privacy. Villa buyouts in Galle, bespoke private chef dining, and rare gem curations were managed with true French-level art de vivre.",
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
