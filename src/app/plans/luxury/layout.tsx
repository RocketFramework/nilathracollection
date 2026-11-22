import type { Metadata } from "next";
import { BASE_URL, getRequestLocale, languageAlternates, localizedUrl, ogLocale, SupportedLocale } from "@/utils/seo-i18n";

const PATH = "/plans/luxury";

const COPY: Record<SupportedLocale, { title: string; description: string; keywords: string[]; breadcrumb: string; plansLabel: string; homeLabel: string }> = {
    en: {
        title: "Ceylon Luxury Collection — 5-Star Private Villa & Resort Journeys",
        description:
            "Indulge in Sri Lanka's finest 5-star signature resorts, private villas, luxury SUV transport, private naturalist safaris, and dedicated itinerary management with Nilathra's Ceylon Luxury plan.",
        keywords: ["luxury Sri Lanka holidays", "5 star Sri Lanka tour packages", "private villa journeys Sri Lanka", "Ceylon Luxury travel plan", "Sapphire Collection Sri Lanka"],
        breadcrumb: "Ceylon Luxury Collection",
        plansLabel: "Plans",
        homeLabel: "Home",
    },
    de: {
        title: "Ceylon Luxury Collection — 5-Sterne Privatvillen & Luxusresorts Sri Lanka",
        description:
            "Genießen Sie Sri Lankas exklusivste 5-Sterne-Resorts, Privatvillen, Luxus-SUV-Transfers, private Naturführer-Safaris und persönliche Reisebetreuung mit der Ceylon Luxury Collection.",
        keywords: ["5 Sterne Luxusreise Sri Lanka", "Privatvilla Urlaub Sri Lanka", "Ceylon Luxury Reiseplan", "Luxusurlaub Sri Lanka", "Nilathra Collection"],
        breadcrumb: "Ceylon Luxury Collection",
        plansLabel: "Reisepläne",
        homeLabel: "Startseite",
    },
    fr: {
        title: "Collection Ceylon Luxury — Villas Privées & Resorts 5 Étoiles au Sri Lanka",
        description:
            "Savourez les plus beaux resorts 5 étoiles et villas privées du Sri Lanka, des transferts en SUV de luxe, des safaris privés et une conciergerie dédiée avec la Collection Ceylon Luxury.",
        keywords: ["voyage de luxe 5 étoiles Sri Lanka", "villa privée Sri Lanka", "séjour luxe Sri Lanka", "Ceylon Luxury Nilathra", "circuit prestige Sri Lanka"],
        breadcrumb: "Collection Ceylon Luxury",
        plansLabel: "Forfaits",
        homeLabel: "Accueil",
    },
};

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRequestLocale();
    const copy = COPY[locale];
    const canonical = localizedUrl(PATH, locale);

    return {
        title: copy.title,
        description: copy.description,
        keywords: copy.keywords,
        robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
        alternates: { canonical, languages: languageAlternates(PATH) },
        openGraph: {
            title: `${copy.title} | Nilathra Collection`,
            description: copy.description,
            url: canonical,
            siteName: "Nilathra Collection",
            locale: ogLocale(locale),
            type: "website",
            images: [{ url: `${BASE_URL}/images/luxury_resort_sunset.avif`, width: 1200, height: 630, alt: copy.title }],
        },
        twitter: {
            card: "summary_large_image",
            title: `${copy.title} | Nilathra Collection`,
            description: copy.description,
            images: [`${BASE_URL}/images/luxury_resort_sunset.avif`],
        },
    };
}

export default async function LuxuryPlanLayout({ children }: { children: React.ReactNode }) {
    const locale = await getRequestLocale();
    const copy = COPY[locale];
    const canonical = localizedUrl(PATH, locale);

    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "TouristTrip",
                "@id": `${canonical}#trip`,
                name: copy.title,
                description: copy.description,
                url: canonical,
                inLanguage: locale,
                provider: { "@type": "Organization", name: "Nilathra Collection", url: BASE_URL },
            },
            {
                "@type": "BreadcrumbList",
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: copy.homeLabel, item: localizedUrl("/", locale) },
                    { "@type": "ListItem", position: 2, name: copy.plansLabel, item: localizedUrl("/plans", locale) },
                    { "@type": "ListItem", position: 3, name: copy.breadcrumb, item: canonical },
                ],
            },
        ],
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            {children}
        </>
    );
}
