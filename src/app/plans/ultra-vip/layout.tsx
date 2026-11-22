import type { Metadata } from "next";
import { BASE_URL, getRequestLocale, languageAlternates, localizedUrl, ogLocale, SupportedLocale } from "@/utils/seo-i18n";

const PATH = "/plans/ultra-vip";

const COPY: Record<SupportedLocale, { title: string; description: string; keywords: string[]; breadcrumb: string; plansLabel: string; homeLabel: string }> = {
    en: {
        title: "Ultra VIP Collection — Sovereign Estate Buyouts & Private Aviation Sri Lanka",
        description:
            "The absolute pinnacle of private travel in Sri Lanka: tarmac jet-side clearance, private helicopter charters, full tea estate & villa buyouts, B6/B7 armored transport, and 24/7 NDA-protected stewardship.",
        keywords: ["Ultra VIP travel Sri Lanka", "private jet Sri Lanka concierge", "Sri Lanka helicopter charter luxury tour", "sovereign estate buyout Sri Lanka", "UHNW travel Sri Lanka DMC"],
        breadcrumb: "Ultra VIP Collection",
        plansLabel: "Plans",
        homeLabel: "Home",
    },
    de: {
        title: "Ultra VIP Collection — Exklusive Anwesen & Privatflüge in Sri Lanka",
        description:
            "Der Höhepunkt privater Luxusreisen in Sri Lanka: Vorfeld-Abfertigung am Privatjet, Helikopter-Charter, vollständige Teeplantagen- & Villen-Buyouts, B6/B7-Sonderschutzfahrzeuge und 24/7-Concierge unter NDA.",
        keywords: ["Ultra VIP Reise Sri Lanka", "Privatjet Concierge Sri Lanka", "Helikopter Charter Sri Lanka", "Exklusives Villen Buyout Sri Lanka", "UHNW Reisen Sri Lanka"],
        breadcrumb: "Ultra VIP Collection",
        plansLabel: "Reisepläne",
        homeLabel: "Startseite",
    },
    fr: {
        title: "Collection Ultra VIP — Domaines Privatisés & Aviation Privée au Sri Lanka",
        description:
            "Le summum du voyage privé au Sri Lanka : accueil sur tarmac en jet privé, transferts en hélicoptère, privatisation complète de domaines et villas, véhicules blindés B6/B7 et conciergerie 24h/24 sous NDA.",
        keywords: ["voyage Ultra VIP Sri Lanka", "jet privé Sri Lanka", "hélicoptère privé Sri Lanka", "privatisation villa domaine Sri Lanka", "voyage UHNW Sri Lanka"],
        breadcrumb: "Collection Ultra VIP",
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

export default async function UltraVIPPlanLayout({ children }: { children: React.ReactNode }) {
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
