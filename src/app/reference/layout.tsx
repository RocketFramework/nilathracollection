import type { Metadata } from "next";
import { withLocalizedCanonical } from "@/utils/seo-i18n";

export async function generateMetadata(): Promise<Metadata> {
    return withLocalizedCanonical("/reference", {
        title: "Sri Lanka Travel Reference, Visa (ETA) & Entry Guidelines",
        description:
            "Essential Sri Lanka travel reference including official Electronic Travel Authorization (ETA) visa links, customs, immigration, and concierge health & safety guidance.",
    });
}

export default function ReferenceLayout({ children }: { children: React.ReactNode }) {
    return children;
}
