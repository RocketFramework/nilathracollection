import MainLayout from "@/components/layout/MainLayout";
import React from "react";
import DestinationClient from "./DestinationClient";
import { Metadata } from "next";

// We keep a lightweight version of the data just for static metadata generation 
// to keep SEO intact without duplicating the whole dictionary.
const metadataData: Record<string, any> = {
    sigiriya: { name: "Sigiriya", description: "Rising 200m above the jungle, Sigiriya is an ancient palace-fortress of incomparable majesty." },
    galle: { name: "Galle", description: "Galle is a jewel where history meets the horizon. A UNESCO World Heritage site." },
    yala: { name: "Yala", description: "Yala National Park is the most visited and second largest national park in Sri Lanka." },
    kandy: { name: "Kandy", description: "Nestled amidst misty green hills, Kandy is the cultural soul of Sri Lanka." },
    colombo: { name: "Colombo", description: "A vibrant fusion of colonial-era heritage and ultra-modern ambition, Colombo is the dynamic heartbeat of Sri Lanka." },
    ella: { name: "Ella", description: "Perched amidst the emerald peaks of the Central Highlands, Ella is a mist-shrouded sanctuary." },
    "weligama-mirissa": { name: "Weligama & Mirissa", description: "Experience the ultimate coastal synergy where the golden sands of Weligama meet the vibrant bays of Mirissa." },
    "nuwara-eliya": { name: "Nuwara Eliya", description: "Elegant, nostalgic, and perpetually cool, Nuwara Eliya is the quintessential highland retreat." },
    trincomalee: { name: "Trincomalee", description: "Trincomalee offers pristine white sand beaches, sacred Hindu temples, and world-class whale watching opportunities." }
};

export async function generateStaticParams() {
    return [
        { slug: "sigiriya" },
        { slug: "galle" },
        { slug: "ella" },
        { slug: "yala" },
        { slug: "kandy" },
        { slug: "nuwara-eliya" },
        { slug: "trincomalee" },
        { slug: "colombo" },
        { slug: "weligama-mirissa" },
    ];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const data = metadataData[slug] || metadataData["sigiriya"];

    return {
        title: `${data.name} | Luxury Travel Sri Lanka`,
        description: data.description,
        alternates: {
            canonical: `https://www.nilathra.com/destinations/${slug}`,
        },
    };
}

export default function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = React.use(params);

    return (
        <MainLayout>
            <DestinationClient slug={slug} />
        </MainLayout>
    );
}
