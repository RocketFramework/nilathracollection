import type { Metadata } from "next";
import { BASE_URL, getRequestLocale, languageAlternates, localizedUrl, ogLocale, SupportedLocale } from "@/utils/seo-i18n";

const PATH = "/partner-registration/tour-guide";

const COPY: Record<SupportedLocale, { title: string; description: string; keywords: string[]; breadcrumb: string; parentLabel: string; homeLabel: string }> = {
    en: {
        title: "Licensed Tour Guide Registration (SLTDA) | Nilathra Collection Sri Lanka",
        description:
            "Register as an SLTDA-licensed national, lecturer, or specialist tour guide with Nilathra Collection. Connect with high-net-worth international travelers across Sri Lanka in English, German, French, and more.",
        keywords: ["SLTDA tour guide registration Sri Lanka", "licensed tourist guide onboarding Sri Lanka", "multilingual tour guide Sri Lanka luxury travel", "national tourist guide lecturer partner"],
        breadcrumb: "Tour Guide Registration",
        parentLabel: "Partner Registration",
        homeLabel: "Home",
    },
    de: {
        title: "Registrierung für lizenzierte Reiseleiter (SLTDA) | Nilathra Collection Sri Lanka",
        description:
            "Registrieren Sie sich als SLTDA-lizenzierter National- oder Spezial-Reiseleiter bei Nilathra Collection. Deutsch-, Französisch- und Englischsprachige Guides für exklusive Sri-Lanka-Reisen gesucht.",
        keywords: ["SLTDA Reiseleiter Registrierung Sri Lanka", "deutschsprachiger Reiseleiter Sri Lanka", "lizenzierter Tour Guide Sri Lanka", "Nilathra Collection Reiseleiter"],
        breadcrumb: "Reiseleiter-Registrierung",
        parentLabel: "Partner-Registrierung",
        homeLabel: "Startseite",
    },
    fr: {
        title: "Inscription Guide Touristique Agréé (SLTDA) | Nilathra Collection Sri Lanka",
        description:
            "Inscrivez-vous en tant que guide touristique national ou spécialiste agréé SLTDA auprès de Nilathra Collection. Guides francophones, germanophones et anglophones pour circuits de luxe au Sri Lanka.",
        keywords: ["inscription guide touristique SLTDA Sri Lanka", "guide francophone Sri Lanka", "guide agréé luxe Sri Lanka", "Nilathra Collection guide"],
        breadcrumb: "Inscription Guide Touristique",
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
            images: [{ url: `${BASE_URL}/images/luxury_resort_sunset.avif`, width: 1200, height: 630, alt: copy.title }],
        },
        twitter: {
            card: "summary_large_image",
            title: copy.title,
            description: copy.description,
            images: [`${BASE_URL}/images/luxury_resort_sunset.avif`],
        },
    };
}

export default async function TourGuideLayout({ children }: { children: React.ReactNode }) {
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
