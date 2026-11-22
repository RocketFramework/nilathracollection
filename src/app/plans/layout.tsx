import { Metadata } from "next";
import { I18nProvider } from "@/components/I18nProvider";
import { getDictionary } from "@/dictionaries";
import { BASE_URL, getRequestLocale, languageAlternates, localizedUrl, ogLocale, SupportedLocale } from "@/utils/seo-i18n";

const PATH = "/plans";

const COPY: Record<SupportedLocale, { title: string; description: string; keywords: string[]; alt: string }> = {
    en: {
        title: "Sri Lanka Tour Plans & Luxury Packages",
        description:
            "Explore Nilathra Collection's four curated Sri Lanka travel tiers — Regular, Premium, Ceylon Luxury, and Ultra VIP — crafted for private, bespoke island journeys.",
        keywords: ["Sri Lanka tour packages", "luxury Sri Lanka travel plans", "bespoke Sri Lanka itineraries", "Ultra VIP Sri Lanka tours", "Nilathra Collection plans"],
        alt: "Nilathra Collection — Bespoke Sri Lanka Travel Plans",
    },
    de: {
        title: "Sri Lanka Reisepläne & Luxus-Reisepakete",
        description:
            "Entdecken Sie die vier exklusiven Sri-Lanka-Reiseklassen der Nilathra Collection – Regular, Premium, Ceylon Luxury und Ultra VIP – für maßgeschneiderte Privatreisen.",
        keywords: ["Sri Lanka Reisepakete", "Luxusreisen Sri Lanka", "maßgeschneiderte Sri Lanka Rundreisen", "Ultra VIP Sri Lanka", "Nilathra Collection"],
        alt: "Nilathra Collection — Maßgeschneiderte Sri Lanka Reisepläne",
    },
    fr: {
        title: "Forfaits & Circuits sur Mesure au Sri Lanka",
        description:
            "Découvrez les quatre gammes de voyages privés au Sri Lanka de Nilathra Collection — Regular, Premium, Ceylon Luxury et Ultra VIP — conçues sur mesure.",
        keywords: ["circuits Sri Lanka", "voyage de luxe Sri Lanka", "séjour sur mesure Sri Lanka", "Ultra VIP Sri Lanka", "Nilathra Collection"],
        alt: "Nilathra Collection — Voyages sur mesure au Sri Lanka",
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
        robots: {
            index: true,
            follow: true,
            googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
        },
        alternates: {
            canonical,
            languages: languageAlternates(PATH),
        },
        openGraph: {
            title: `${copy.title} | Nilathra Collection`,
            description: copy.description,
            url: canonical,
            siteName: "Nilathra Collection",
            locale: ogLocale(locale),
            type: "website",
            images: [{ url: `${BASE_URL}/images/plans/ultra-vip.avif`, width: 1200, height: 630, alt: copy.alt }],
        },
        twitter: {
            card: "summary_large_image",
            title: `${copy.title} | Nilathra Collection`,
            description: copy.description,
            images: [`${BASE_URL}/images/plans/ultra-vip.avif`],
        },
    };
}

export default async function PlansLayout({ children }: { children: React.ReactNode }) {
    const locale = await getRequestLocale();
    const dict = await getDictionary(locale);

    return <I18nProvider dictionary={dict}>{children}</I18nProvider>;
}
