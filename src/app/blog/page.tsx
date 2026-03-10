import BlogListingContent from "./BlogListingContent";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "The Nilathra Journal | Luxury Travel Blog Sri Lanka",
    description: "Discover the secrets of the island, from hidden heritage sites to the nuances of world-class concierge service. Insights and inspirations from Nilathra Collection.",
    openGraph: {
        title: "The Nilathra Journal | Luxury Travel Insights",
        description: "Discover the secrets of the island with Nilathra Collection.",
        images: ["/images/luxury_resort_sunset.png"],
    },
};

export default function BlogListingPage() {
    return <BlogListingContent />;
}
