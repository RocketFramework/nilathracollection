import type { Metadata } from "next";
import { BASE_URL, getRequestLocale, languageAlternates, localizedUrl, ogLocale, SupportedLocale } from "@/utils/seo-i18n";

const PATH = "/plans/compare";

const COPY: Record<SupportedLocale, { title: string; description: string; keywords: string[]; breadcrumb: string; plansLabel: string; homeLabel: string }> = {
    en: {
        title: "Compare Sri Lanka Travel Plans — Regular, Premium, Luxury & Ultra VIP",
        description:
            "Compare Nilathra Collection's four bespoke Sri Lanka journey tiers side by side: hotels, private vehicles, helicopter transfers, VIP security, dining, and concierge inclusions.",
        keywords: ["compare Sri Lanka tour packages", "Sri Lanka luxury vs ultra VIP tour", "Nilathra travel plan comparison", "Sri Lanka tour tiers matrix", "best Sri Lanka itinerary package"],
        breadcrumb: "Compare Plans",
        plansLabel: "Plans",
        homeLabel: "Home",
    },
    de: {
        title: "Sri Lanka Reisepläne vergleichen — Regular, Premium, Luxury & Ultra VIP",
        description:
            "Vergleichen Sie die vier Sri-Lanka-Reiseklassen der Nilathra Collection im direkten Überblick: Hotels, Privatfahrzeuge, Helikopter-Transfers, VIP-Sicherheit, Kulinarik und Concierge-Leistungen.",
        keywords: ["Sri Lanka Reisepakete vergleichen", "Sri Lanka Luxus vs Ultra VIP", "Nilathra Reiseklassen Vergleich", "Sri Lanka Rundreise Vergleich"],
        breadcrumb: "Reisepläne vergleichen",
        plansLabel: "Reisepläne",
        homeLabel: "Startseite",
    },
    fr: {
        title: "Comparer nos Forfaits Sri Lanka — Regular, Premium, Luxury & Ultra VIP",
        description:
            "Comparez côte à côte les quatre gammes de voyages au Sri Lanka de Nilathra Collection : hôtels, véhicules privés, hélicoptères, sécurité VIP, gastronomie et conciergerie.",
        keywords: ["comparer circuits Sri Lanka", "Sri Lanka luxe vs ultra VIP", "comparatif forfaits Nilathra", "gammes voyage Sri Lanka"],
        breadcrumb: "Comparer les forfaits",
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
            images: [{ url: `${BASE_URL}/images/plans/ultra-vip.avif`, width: 1200, height: 630, alt: copy.title }],
        },
        twitter: {
            card: "summary_large_image",
            title: `${copy.title} | Nilathra Collection`,
            description: copy.description,
            images: [`${BASE_URL}/images/plans/ultra-vip.avif`],
        },
    };
}

export default async function ComparePlansLayout({ children }: { children: React.ReactNode }) {
    const locale = await getRequestLocale();
    const copy = COPY[locale];
    const canonical = localizedUrl(PATH, locale);

    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebPage",
                "@id": `${canonical}#webpage`,
                url: canonical,
                name: copy.title,
                description: copy.description,
                inLanguage: locale,
                isPartOf: { "@id": `${BASE_URL}#website` },
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
