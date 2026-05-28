import MainLayout from "@/components/layout/MainLayout";
import EliteJourneysContent from "./EliteJourneysContent";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Elite Journeys | Luxury Sri Lanka Itinerary | Nilathra Collection",
    description: "Discover our signature 7-night/8-day luxury Sri Lanka itinerary. Experience Colombo, the Cultural Triangle, Kandy, Nuwara Eliya, and Galle Fort in absolute comfort.",
    alternates: {
        canonical: "https://www.nilathra.com/elite-journeys",
    },
    openGraph: {
        title: "Elite Journeys | Luxury Sri Lanka Itinerary | Nilathra Collection",
        description: "Discover our signature 7-night/8-day luxury Sri Lanka itinerary. Experience Colombo, the Cultural Triangle, Kandy, Nuwara Eliya, and Galle Fort in absolute comfort.",
        url: "https://www.nilathra.com/elite-journeys",
        siteName: "Nilathra Collection",
        images: [
            {
                url: "https://images.unsplash.com/photo-1583037189850-1921be2077e6",
                width: 1200,
                height: 630,
                alt: "Elite Journeys Sri Lanka Itinerary",
            },
        ],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Elite Journeys | Luxury Sri Lanka Itinerary | Nilathra Collection",
        description: "Discover our signature 7-night/8-day luxury Sri Lanka itinerary with Nilathra Collection.",
        images: ["https://images.unsplash.com/photo-1583037189850-1921be2077e6"],
    },
};

export default function EliteJourneysPage() {
    return (
        <MainLayout>
            <EliteJourneysContent />
        </MainLayout>
    );
}
