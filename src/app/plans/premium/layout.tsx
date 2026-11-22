import type { Metadata } from "next";
import { BASE_URL, getRequestLocale, languageAlternates, localizedUrl, ogLocale, SupportedLocale } from "@/utils/seo-i18n";

const PATH = "/plans/premium";

const COPY: Record<SupportedLocale, { title: string; description: string; keywords: string[]; breadcrumb: string; plansLabel: string; homeLabel: string }> = {
    en: {
        title: "Premium Collection — Boutique Heritage & Highland Sri Lanka Tours",
        description:
            "Experience Nilathra Collection's Premium Collection (Emerald Route): handpicked boutique luxury hotels, personal chauffeur-guides, private safaris, and elevated Sri Lankan cultural journeys.",
        keywords: ["premium Sri Lanka tour packages", "boutique luxury Sri Lanka tours", "Emerald Route Sri Lanka", "Sri Lanka private heritage tour", "Nilathra Premium Collection"],
        breadcrumb: "Premium Collection",
        plansLabel: "Plans",
        homeLabel: "Home",
    },
    de: {
        title: "Premium Collection — Boutique- & Hochland-Rundreisen Sri Lanka",
        description:
            "Erleben Sie die Premium Collection (Emerald Route) der Nilathra Collection: handverlesene Boutique-Hotels, persönlicher Chauffeur-Guide, private Safaris und exklusive Kulturreisen durch Sri Lanka.",
        keywords: ["Premium Rundreise Sri Lanka", "Boutique Hotels Sri Lanka Reise", "Emerald Route Sri Lanka", "Sri Lanka Hochland Safari", "Nilathra Premium Collection"],
        breadcrumb: "Premium Collection",
        plansLabel: "Reisepläne",
        homeLabel: "Startseite",
    },
    fr: {
        title: "Collection Premium — Circuits Boutique & Hauts Plateaux au Sri Lanka",
        description:
            "Découvrez la Collection Premium (Route Émeraude) de Nilathra Collection : hôtels-boutiques de prestige, chauffeur-guide privé, safaris exclusifs et découvertes culturelles au Sri Lanka.",
        keywords: ["circuit premium Sri Lanka", "hôtels boutique Sri Lanka", "Route Émeraude Sri Lanka", "safari privé Sri Lanka", "Nilathra Collection Premium"],
        breadcrumb: "Collection Premium",
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
            images: [{ url: `${BASE_URL}/images/hotel_boutique.avif`, width: 1200, height: 630, alt: copy.title }],
        },
        twitter: {
            card: "summary_large_image",
            title: `${copy.title} | Nilathra Collection`,
            description: copy.description,
            images: [`${BASE_URL}/images/hotel_boutique.avif`],
        },
    };
}

export default async function PremiumPlanLayout({ children }: { children: React.ReactNode }) {
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
