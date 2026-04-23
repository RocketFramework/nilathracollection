import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Signature Ceylon Experience | Elite Journeys",
    description: "A 7-night/8-day signature journey through Sri Lanka's cultural heart and colonial highlands. Curated for the discerning traveler.",
};

export default function EliteJourneysLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
