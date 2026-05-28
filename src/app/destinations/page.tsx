import MainLayout from "@/components/layout/MainLayout";
import DestinationsContent from "./DestinationsContent";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Luxury Destinations Sri Lanka | Nilathra Collection",
    description: "Explore the most exclusive luxury travel destinations in Sri Lanka. From Colombo and Galle Fort to Sigiriya, Kandy, Nuwara Eliya, and Yala National Park.",
    alternates: {
        canonical: "https://www.nilathra.com/destinations",
    },
    openGraph: {
        title: "Luxury Destinations Sri Lanka | Nilathra Collection",
        description: "Explore the most exclusive luxury travel destinations in Sri Lanka. From Colombo and Galle Fort to Sigiriya, Kandy, Nuwara Eliya, and Yala National Park.",
        url: "https://www.nilathra.com/destinations",
        siteName: "Nilathra Collection",
        images: [
            {
                url: "/images/colombo_morning_drone.avif",
                width: 1200,
                height: 630,
                alt: "Luxury Destinations in Sri Lanka",
            },
        ],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Luxury Destinations Sri Lanka | Nilathra Collection",
        description: "Explore the most exclusive luxury travel destinations in Sri Lanka with Nilathra Collection.",
        images: ["/images/colombo_morning_drone.avif"],
    },
};

export default function DestinationsPage() {
    return (
        <MainLayout>
            <DestinationsContent />
        </MainLayout>
    );
}
