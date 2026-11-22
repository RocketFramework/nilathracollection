import type { Metadata } from "next";
import { headers } from "next/headers";

export type SupportedLocale = "en" | "de" | "fr";

export const BASE_URL = "https://www.nilathra.com";

export async function getRequestLocale(): Promise<SupportedLocale> {
    const h = await headers();
    const raw = (h.get("x-locale") || "en").toLowerCase();
    if (raw === "de" || raw === "fr") return raw;
    return "en";
}

export function localizedUrl(path: string, locale: SupportedLocale): string {
    if (path === "/" || path === "") {
        return locale === "en" ? BASE_URL : `${BASE_URL}/${locale}`;
    }
    const clean = path.startsWith("/") ? path : `/${path}`;
    return locale === "en" ? `${BASE_URL}${clean}` : `${BASE_URL}/${locale}${clean}`;
}

export function ogLocale(locale: SupportedLocale): string {
    if (locale === "de") return "de_DE";
    if (locale === "fr") return "fr_FR";
    return "en_US";
}

export function languageAlternates(path: string) {
    if (path === "/" || path === "") {
        return {
            "x-default": BASE_URL,
            en: BASE_URL,
            de: `${BASE_URL}/de`,
            fr: `${BASE_URL}/fr`,
        };
    }
    const clean = path.startsWith("/") ? path : `/${path}`;
    return {
        "x-default": `${BASE_URL}${clean}`,
        en: `${BASE_URL}${clean}`,
        de: `${BASE_URL}/de${clean}`,
        fr: `${BASE_URL}/fr${clean}`,
    };
}

export async function withLocalizedCanonical(path: string, base: Metadata): Promise<Metadata> {
    const locale = await getRequestLocale();
    const canonical = localizedUrl(path, locale);
    return {
        ...base,
        alternates: {
            ...base.alternates,
            canonical,
            languages: languageAlternates(path),
        },
        openGraph: base.openGraph
            ? {
                  ...base.openGraph,
                  url: canonical,
                  locale: ogLocale(locale),
              }
            : undefined,
    };
}
