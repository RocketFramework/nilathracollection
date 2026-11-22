import type { Metadata } from "next";
import { headers } from "next/headers";
import { getDictionary } from "@/dictionaries";
import { I18nProvider } from "@/components/I18nProvider";
import HomeClient from "./HomeClient";
import { getRequestLocale, languageAlternates, localizedUrl, ogLocale, SupportedLocale } from "@/utils/seo-i18n";

const HOME_META: Record<SupportedLocale, { title: string; description: string }> = {
    en: {
        title: "Best Travel Agency in Sri Lanka | Holidays in Sri Lanka",
        description: "Nilathra Collection is Sri Lanka's premier luxury travel curator. Experience bespoke journeys, VIP handling, and heritage retreats that go above and beyond the norm.",
    },
    de: {
        title: "Luxusreisen Sri Lanka | Maßgeschneiderte Privatreisen — Nilathra Collection",
        description: "Nilathra Collection ist Sri Lankas exklusiver Luxusreise-Kurator für maßgeschneiderte Privatreisen, VIP-Betreuung, Privatvillen und Helikopter-Safaris.",
    },
    fr: {
        title: "Voyages de Luxe au Sri Lanka | Circuits Privés sur Mesure — Nilathra Collection",
        description: "Nilathra Collection est le créateur de voyages de luxe de référence au Sri Lanka : circuits privés sur mesure, accueil VIP, domaines privatisés et safaris exclusifs.",
    },
};

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRequestLocale();
    const meta = HOME_META[locale];
    const canonical = localizedUrl("/", locale);

    return {
        title: { absolute: meta.title },
        description: meta.description,
        alternates: {
            canonical,
            languages: languageAlternates("/"),
        },
        openGraph: {
            title: meta.title,
            description: meta.description,
            url: canonical,
            siteName: "Nilathra Collection",
            locale: ogLocale(locale),
            type: "website",
            images: [
                {
                    url: "https://www.nilathra.com/images/luxury_resort_sunset.avif",
                    width: 1200,
                    height: 630,
                    alt: "Nilathra Collection — Luxury Travel Sri Lanka",
                },
            ],
        },
    };
}

export default async function Home() {
    const headersList = await headers();
    const locale = headersList.get("x-locale") || "en";
    const dictionary = await getDictionary(locale);

    return (
        <I18nProvider dictionary={dictionary}>
            <HomeClient />
        </I18nProvider>
    );
}
