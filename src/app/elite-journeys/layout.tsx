import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Elite Journeys - Ultra Premium Sri Lanka Tour | Nilathra Collection",
    description: "Experience the ultimate 8-day luxury tour of Sri Lanka. Featuring signature 5-star resorts, private luxury SUV transport, and exclusive VIP access to the island's most majestic sights.",
};

export default function EliteJourneysLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
