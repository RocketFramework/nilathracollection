import { Metadata } from "next";
import { I18nProvider } from "@/components/I18nProvider";
import { headers } from "next/headers";
import { getDictionary } from "@/dictionaries";

export const metadata: Metadata = {
    title: "Our Plans | Bespoke Sri Lanka Journeys",
};

export default async function PlansLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const headersList = await headers();
    const locale = headersList.get('x-locale') || 'en';
    const dict = await getDictionary(locale);

    return <I18nProvider dictionary={dict}>{children}</I18nProvider>;
}
