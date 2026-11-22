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
    const clean = path.startsWith("/") ? path : `/${path}`;
    return locale === "en" ? `${BASE_URL}${clean}` : `${BASE_URL}/${locale}${clean}`;
}

export function ogLocale(locale: SupportedLocale): string {
    if (locale === "de") return "de_DE";
    if (locale === "fr") return "fr_FR";
    return "en_US";
}

export function languageAlternates(path: string) {
    const clean = path.startsWith("/") ? path : `/${path}`;
    return {
        "x-default": `${BASE_URL}${clean}`,
        en: `${BASE_URL}${clean}`,
        de: `${BASE_URL}/de${clean}`,
        fr: `${BASE_URL}/fr${clean}`,
    };
}
