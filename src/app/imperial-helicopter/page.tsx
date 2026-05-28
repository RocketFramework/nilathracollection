import MainLayout from "@/components/layout/MainLayout";
import ImperialHelicopterContent from "./ImperialHelicopterContent";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Imperial Helicopter Tour | Luxury Sri Lanka Itinerary | Nilathra Collection",
    description: "Experience Sri Lanka from above with our exclusive 5-night/6-day Imperial Helicopter Tour. Travel seamlessly between Colombo, Kandy, Tea Country, and Weligama.",
    alternates: {
        canonical: "https://www.nilathra.com/imperial-helicopter",
    },
    openGraph: {
        title: "Imperial Helicopter Tour | Luxury Sri Lanka Itinerary | Nilathra Collection",
        description: "Experience Sri Lanka from above with our exclusive 5-night/6-day Imperial Helicopter Tour. Travel seamlessly between Colombo, Kandy, Tea Country, and Weligama.",
        url: "https://www.nilathra.com/imperial-helicopter",
        siteName: "Nilathra Collection",
        images: [
            {
                url: "https://images.unsplash.com/photo-1580915411954-282cb1b0d780?q=80",
                width: 1200,
                height: 630,
                alt: "Imperial Helicopter Tour in Sri Lanka",
            },
        ],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Imperial Helicopter Tour | Luxury Sri Lanka Itinerary | Nilathra Collection",
        description: "Experience Sri Lanka from above with our exclusive 5-night/6-day Imperial Helicopter Tour with Nilathra Collection.",
        images: ["https://images.unsplash.com/photo-1580915411954-282cb1b0d780?q=80"],
    },
};

export default function ImperialHelicopterPage() {
    return (
        <MainLayout>
            <ImperialHelicopterContent />
        </MainLayout>
    );
}
