import BlogListingContent from "./BlogListingContent";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Travel Blog | Travel to Sri Lanka Tips & Guides",
    description: "Discover the secrets of the island, from hidden heritage sites to the nuances of world-class concierge service. Insights and inspirations from Nilathra Collection.",
    keywords: [
        "luxury travel blog sri lanka",
        "sri lanka travel guide",
        "sri lanka luxury experiences",
        "best places to visit sri lanka",
        "sri lanka wildlife safari",
        "nilathra collection blog",
        "ayurveda retreats sri lanka",
        "sri lanka tea country",
        "blue whale watching sri lanka",
        "sigiriya rock fortress",
    ],
    alternates: {
        canonical: "https://nilathra.com/blog",
    },
    openGraph: {
        title: "Travel Blog | Travel to Sri Lanka Tips & Guides",
        description: "Discover the secrets of the island with Nilathra Collection.",
        url: "https://nilathra.com/blog",
        siteName: "Nilathra Collection",
        images: [
            {
                url: "/images/luxury_resort_sunset.avif",
                width: 1200,
                height: 630,
                alt: "The Nilathra Journal – Luxury Travel Blog Sri Lanka",
            },
        ],
    },
};

export default function BlogListingPage() {
    return <BlogListingContent />;
}
