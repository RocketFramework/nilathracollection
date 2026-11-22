import type { Metadata } from "next";
import { BASE_URL, getRequestLocale, languageAlternates, localizedUrl, ogLocale, SupportedLocale } from "@/utils/seo-i18n";

const PATH = "/partner-registration/activity-vendor";

const COPY: Record<SupportedLocale, { title: string; description: string; keywords: string[]; breadcrumb: string; parentLabel: string; homeLabel: string }> = {
    en: {
        title: "Activity & Experience Vendor Registration | Nilathra Collection Sri Lanka",
        description:
            "Register as a curated activity, excursion, safari, or cultural experience vendor with Nilathra Collection. Showcase your Sri Lankan experiences to luxury and UHNW travelers.",
        keywords: ["Sri Lanka activity vendor registration", "excursion supplier onboarding Sri Lanka", "safari and tour operator partner Sri Lanka", "luxury experience vendor Sri Lanka DMC"],
        breadcrumb: "Activity Vendor Registration",
        parentLabel: "Partner Registration",
        homeLabel: "Home",
    },
    de: {
        title: "Registrierung für Aktivitäts- & Erlebnisanbieter | Nilathra Collection Sri Lanka",
        description:
            "Registrieren Sie sich als Anbieter für exklusive Ausflüge, Safaris und Kulturerlebnisse in Sri Lanka im Luxuspartner-Netzwerk der Nilathra Collection.",
        keywords: ["Aktivitätsanbieter Registrierung Sri Lanka", "Safari Partner Sri Lanka", "Ausflugsanbieter Onboarding Sri Lanka", "Nilathra Collection Erlebnisse"],
        breadcrumb: "Aktivitätsanbieter-Registrierung",
        parentLabel: "Partner-Registrierung",
        homeLabel: "Startseite",
    },
    fr: {
        title: "Inscription Prestataire d'Activités & Excursions | Nilathra Collection Sri Lanka",
        description:
            "Enregistrez vos excursions, safaris et expériences culturelles sur mesure au Sri Lanka auprès du réseau de partenaires de luxe Nilathra Collection.",
        keywords: ["inscription prestataire activités Sri Lanka", "partenaire safari excursion Sri Lanka", "opérateur expériences luxe Sri Lanka", "Nilathra Collection"],
        breadcrumb: "Prestataire d'activités",
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

export default async function ActivityVendorLayout({ children }: { children: React.ReactNode }) {
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
