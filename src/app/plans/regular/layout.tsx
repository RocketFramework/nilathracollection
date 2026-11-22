import type { Metadata } from "next";
import { BASE_URL, getRequestLocale, languageAlternates, localizedUrl, ogLocale, SupportedLocale } from "@/utils/seo-i18n";

const PATH = "/plans/regular";

const COPY: Record<SupportedLocale, { title: string; description: string; keywords: string[]; breadcrumb: string; plansLabel: string; homeLabel: string }> = {
    en: {
        title: "Regular Collection — Essential Private Sri Lanka Tours",
        description:
            "Discover Nilathra Collection's Regular Collection (Pearl Route): essential private Sri Lanka tours featuring comfortable boutique stays, licensed chauffeur-guides, and iconic cultural highlights.",
        keywords: ["private Sri Lanka tours", "essential Sri Lanka holiday package", "Sri Lanka chauffeur driven tour", "Pearl Route Sri Lanka", "Nilathra Regular Collection"],
        breadcrumb: "Regular Collection",
        plansLabel: "Plans",
        homeLabel: "Home",
    },
    de: {
        title: "Regular Collection — Private Sri Lanka Rundreisen (Pearl Route)",
        description:
            "Entdecken Sie die Regular Collection (Pearl Route) von Nilathra Collection: private Sri-Lanka-Rundreisen mit ausgewählten Boutique-Hotels, lizenziertem Chauffeur-Guide und kulturellen Höhepunkten.",
        keywords: ["Sri Lanka Privatreise", "Sri Lanka Rundreise mit Fahrer", "Pearl Route Sri Lanka", "Sri Lanka Urlaubspaket", "Nilathra Regular Collection"],
        breadcrumb: "Regular Collection",
        plansLabel: "Reisepläne",
        homeLabel: "Startseite",
    },
    fr: {
        title: "Collection Regular — Circuits Privés Essentiels au Sri Lanka",
        description:
            "Découvrez la Collection Regular (Route des Perles) de Nilathra Collection : circuits privés au Sri Lanka avec hôtels de charme, chauffeur-guide agréé et découvertes culturelles authentiques.",
        keywords: ["circuit privé Sri Lanka", "voyage Sri Lanka avec chauffeur", "Route des Perles Sri Lanka", "séjour Sri Lanka", "Nilathra Collection Regular"],
        breadcrumb: "Collection Regular",
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
            images: [{ url: `${BASE_URL}/images/tier_standard.avif`, width: 1200, height: 630, alt: copy.title }],
        },
        twitter: {
            card: "summary_large_image",
            title: `${copy.title} | Nilathra Collection`,
            description: copy.description,
            images: [`${BASE_URL}/images/tier_standard.avif`],
        },
    };
}

export default async function RegularPlanLayout({ children }: { children: React.ReactNode }) {
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
