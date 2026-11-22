import type { Metadata } from "next";
import { BASE_URL, getRequestLocale, languageAlternates, localizedUrl, ogLocale, SupportedLocale } from "@/utils/seo-i18n";

const PATH = "/partner-registration/chauffeur";

const COPY: Record<SupportedLocale, { title: string; description: string; keywords: string[]; breadcrumb: string; parentLabel: string; homeLabel: string }> = {
    en: {
        title: "Chauffeur & Private Driver Registration | Nilathra Collection Sri Lanka",
        description:
            "Apply to join Nilathra Collection as a professional private chauffeur or luxury tourist driver in Sri Lanka. Submit your license, credentials, and daily rates through our official onboarding portal.",
        keywords: ["Sri Lanka chauffeur registration", "tourist driver onboarding Sri Lanka", "luxury private driver jobs Sri Lanka", "SLTDA chauffeur partner Sri Lanka"],
        breadcrumb: "Chauffeur Registration",
        parentLabel: "Partner Registration",
        homeLabel: "Home",
    },
    de: {
        title: "Chauffeur- & Privatfahrer-Registrierung | Nilathra Collection Sri Lanka",
        description:
            "Bewerben Sie sich als professioneller Privat-Chauffeur oder Luxus-Touristikfahrer in Sri Lanka bei Nilathra Collection über unser offizielles Onboarding-Portal.",
        keywords: ["Chauffeur Registrierung Sri Lanka", "Touristikfahrer Sri Lanka", "Privatfahrer Partner Sri Lanka", "Nilathra Collection Chauffeur"],
        breadcrumb: "Chauffeur-Registrierung",
        parentLabel: "Partner-Registrierung",
        homeLabel: "Startseite",
    },
    fr: {
        title: "Inscription Chauffeur Privé & Conducteur Touristique | Nilathra Collection Sri Lanka",
        description:
            "Rejoignez Nilathra Collection en tant que chauffeur privé ou conducteur touristique de luxe au Sri Lanka via notre portail officiel d'inscription.",
        keywords: ["inscription chauffeur privé Sri Lanka", "conducteur touristique Sri Lanka", "chauffeur luxe Sri Lanka", "Nilathra Collection chauffeur"],
        breadcrumb: "Inscription Chauffeur",
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

export default async function ChauffeurLayout({ children }: { children: React.ReactNode }) {
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
