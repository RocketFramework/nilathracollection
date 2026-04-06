import { headers } from "next/headers";
import { getDictionary } from "@/dictionaries";
import { I18nProvider } from "@/components/I18nProvider";
import HomeClient from "./HomeClient";

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
