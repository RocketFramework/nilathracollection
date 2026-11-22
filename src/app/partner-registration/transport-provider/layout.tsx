import type { Metadata } from "next";
import { BASE_URL, getRequestLocale, languageAlternates, localizedUrl, ogLocale, SupportedLocale } from "@/utils/seo-i18n";

const PATH = "/partner-registration/transport-provider";

const COPY: Record<SupportedLocale, { title: string; description: string; keywords: string[]; breadcrumb: string; parentLabel: string; homeLabel: string }> = {
    en: {
        title: "Transport Provider Registration & Fleet Onboarding | Nilathra Collection Sri Lanka",
        description:
            "Register your luxury fleet and SLTDA-compliant tourist transport service with Nilathra Collection. Partner with Sri Lanka's premier luxury DMC to serve discerning international travelers.",
        keywords: ["Sri Lanka transport provider registration", "tourist transport fleet onboarding Sri Lanka", "luxury vehicle partner Sri Lanka DMC", "SLTDA transport supplier registration"],
        breadcrumb: "Transport Provider Onboarding",
        parentLabel: "Partner Registration",
        homeLabel: "Home",
    },
    de: {
        title: "Transportanbieter-Registrierung & Flotten-Onboarding | Nilathra Collection Sri Lanka",
        description:
            "Registrieren Sie Ihre Luxusfahrzeugflotte und SLTDA-konforme Touristiktransporte bei Nilathra Collection in Sri Lanka für anspruchsvolle internationale Reisende.",
        keywords: ["Transportanbieter Registrierung Sri Lanka", "Touristikflotte Onboarding Sri Lanka", "Luxusfahrzeuge Partner Sri Lanka", "Nilathra Collection Transportpartner"],
        breadcrumb: "Transportanbieter-Onboarding",
        parentLabel: "Partner-Registrierung",
        homeLabel: "Startseite",
    },
    fr: {
        title: "Inscription Prestataire de Transport & Flotte | Nilathra Collection Sri Lanka",
        description:
            "Enregistrez votre flotte de véhicules de luxe et vos services de transport touristique conformes SLTDA auprès de Nilathra Collection au Sri Lanka.",
        keywords: ["inscription prestataire transport Sri Lanka", "flotte véhicules luxe Sri Lanka", "partenaire transport DMC Sri Lanka", "Nilathra Collection transport"],
        breadcrumb: "Prestataire de transport",
        parentLabel: "Inscription Partenaires",
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
            title: copy.title,
            description: copy.description,
            url: canonical,
            siteName: "Nilathra Collection",
            locale: ogLocale(locale),
            type: "website",
            images: [{ url: `${BASE_URL}/images/partners/transport-wanted.jpg`, width: 1200, height: 630, alt: copy.title }],
        },
        twitter: {
            card: "summary_large_image",
            title: copy.title,
            description: copy.description,
            images: [`${BASE_URL}/images/partners/transport-wanted.jpg`],
        },
    };
}

export default async function TransportProviderLayout({ children }: { children: React.ReactNode }) {
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
                    { "@type": "ListItem", position: 2, name: copy.parentLabel, item: localizedUrl("/partner-registration", locale) },
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
