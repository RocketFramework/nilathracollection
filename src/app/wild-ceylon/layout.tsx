import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Wild Ceylon & Seclusion | Nilathra Collection",
    description: "An exclusive 10-night journey blending private leopard safaris in Yala, seaplane transfers, and boutique beach villas on Sri Lanka's quietest coastline.",
};

export default function WildCeylonLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
