import BlogListingContent from "./BlogListingContent";
import { blogPosts } from "@/data/blog-posts";
import { Metadata } from "next";
import { BASE_URL, getRequestLocale, languageAlternates, localizedUrl, ogLocale, SupportedLocale } from "@/utils/seo-i18n";

const BLOG_COPY: Record<SupportedLocale, { title: string; description: string; homeLabel: string; blogLabel: string }> = {
    en: {
        title: "Travel Blog | Travel to Sri Lanka Tips, Cuisine & Luxury Guides",
        description: "Discover the secrets of the island, from authentic Sri Lankan cuisine and hidden heritage sites to world-class concierge travel guides from Nilathra Collection.",
        homeLabel: "Home",
        blogLabel: "Blog",
    },
    de: {
        title: "Sri Lanka Reiseblog | Tipps, Kulinarik & Luxus-Reiseführer",
        description: "Entdecken Sie Sri Lankas Geheimnisse – von authentischer sri-lankischer Küche und Kulturstätten bis zu exklusiven Luxusreise-Guides der Nilathra Collection.",
        homeLabel: "Startseite",
        blogLabel: "Blog",
    },
    fr: {
        title: "Blog Voyage Sri Lanka | Conseils, Gastronomie & Guides de Luxe",
        description: "Découvrez les secrets du Sri Lanka, de la gastronomie locale authentique aux sites patrimoniaux cachés et guides de voyage de luxe par Nilathra Collection.",
        homeLabel: "Accueil",
        blogLabel: "Blog",
    },
};

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRequestLocale();
    const copy = BLOG_COPY[locale];
    const canonical = localizedUrl("/blog", locale);

    return {
        title: copy.title,
        description: copy.description,
        keywords: [
            "luxury travel blog sri lanka",
            "sri lanka travel guide",
            "local sri lankan food guide",
            "dubai families sri lanka luxury itinerary",
            "michelin three key hotels sri lanka",
            "relais & chateaux sri lanka tea bungalows",
            "sri lanka luxury experiences",
            "best places to visit sri lanka",
            "sri lanka wildlife safari",
            "nilathra collection blog",
            "ayurveda retreats sri lanka",
            "sri lanka tea country",
            "blue whale watching sri lanka",
            "sigiriya rock fortress",
        ],
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                "max-image-preview": "large",
                "max-snippet": -1,
                "max-video-preview": -1,
            },
        },
        alternates: {
            canonical,
            languages: languageAlternates("/blog"),
            types: {
                "application/rss+xml": `${BASE_URL}/blog/feed.xml`,
            },
        },
        openGraph: {
            title: copy.title,
            description: copy.description,
            url: canonical,
            siteName: "Nilathra Collection",
            locale: ogLocale(locale),
            type: "website",
            images: [
                {
                    url: `${BASE_URL}/images/luxury_resort_sunset.avif`,
                    width: 1200,
                    height: 630,
                    alt: "The Nilathra Journal – Luxury Travel Blog Sri Lanka",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: copy.title,
            description: copy.description,
            images: [`${BASE_URL}/images/luxury_resort_sunset.avif`],
        },
    };
}

export default async function BlogListingPage() {
    const locale = await getRequestLocale();
    const copy = BLOG_COPY[locale];
    const canonical = localizedUrl("/blog", locale);

    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Blog",
                "@id": `${canonical}#blog`,
                name: "The Nilathra Journal",
                description: copy.description,
                url: canonical,
                inLanguage: locale,
                publisher: {
                    "@type": "Organization",
                    name: "Nilathra Collection",
                    url: BASE_URL,
                    logo: {
                        "@type": "ImageObject",
                        url: `${BASE_URL}/images/nilathra-logo.webp`,
                    },
                },
                blogPost: blogPosts.map((post) => ({
                    "@type": "BlogPosting",
                    headline: post.title,
                    description: post.excerpt,
                    url: localizedUrl(`/blog/${post.slug}`, locale),
                    image: `${BASE_URL}${post.image}`,
                    datePublished: new Date(post.date).toISOString(),
                    articleSection: post.category,
                    author: {
                        "@type": "Organization",
                        name: post.author,
                    },
                })),
            },
            {
                "@type": "ItemList",
                "@id": `${canonical}#itemlist`,
                numberOfItems: blogPosts.length,
                itemListElement: blogPosts.map((post, idx) => ({
                    "@type": "ListItem",
                    position: idx + 1,
                    url: localizedUrl(`/blog/${post.slug}`, locale),
                    name: post.title,
                })),
            },
            {
                "@type": "BreadcrumbList",
                "@id": `${canonical}#breadcrumb`,
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: copy.homeLabel, item: localizedUrl("/", locale) },
                    { "@type": "ListItem", position: 2, name: copy.blogLabel, item: canonical },
                ],
            },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <BlogListingContent />
        </>
    );
}
