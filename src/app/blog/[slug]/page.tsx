import { blogPosts } from "@/data/blog-posts";
import { notFound } from "next/navigation";
import BlogContent from "./BlogContent";
import { Metadata } from "next";
import { BASE_URL, getRequestLocale, languageAlternates, localizedUrl, ogLocale } from "@/utils/seo-i18n";

interface Props {
    params: Promise<{ slug: string }>;
}

function toIsoDate(dateStr: string): string {
    const parsed = new Date(dateStr);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function extractContentImages(content: string): string[] {
    const matches = [...content.matchAll(/(?:src=["']|\]\()(\/images\/[^"')\s]+)/g)].map((m) => `${BASE_URL}${m[1]}`);
    return Array.from(new Set(matches));
}

function estimateWordCount(content: string): number {
    const plain = content
        .replace(/<[^>]+>/g, " ")
        .replace(/[#*_`>\-[\]()]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    return plain ? plain.split(" ").length : 0;
}

export async function generateStaticParams() {
    return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = blogPosts.find((p) => p.slug === slug);

    if (!post) {
        return {
            title: "Post Not Found | Nilathra Collection",
            robots: { index: false, follow: false },
        };
    }

    const locale = await getRequestLocale();
    const relPath = `/blog/${post.slug}`;
    const canonicalUrl = localizedUrl(relPath, locale);
    const absoluteImage = post.image.startsWith("http") ? post.image : `${BASE_URL}${post.image}`;
    const publishedIso = toIsoDate(post.date);

    return {
        title: `${post.title} | Nilathra Collection Sri Lanka`,
        description: post.excerpt,
        keywords: post.keywords ?? [post.category, "Sri Lanka travel", "Nilathra Collection", post.title],
        authors: [{ name: post.author }],
        category: post.category,
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
            canonical: canonicalUrl,
            languages: languageAlternates(relPath),
            types: {
                "application/rss+xml": `${BASE_URL}/blog/feed.xml`,
            },
        },
        openGraph: {
            title: post.title,
            description: post.excerpt,
            url: canonicalUrl,
            siteName: "Nilathra Collection",
            locale: ogLocale(locale),
            images: [
                {
                    url: absoluteImage,
                    width: 1200,
                    height: 630,
                    alt: post.title,
                },
            ],
            type: "article",
            publishedTime: publishedIso,
            modifiedTime: publishedIso,
            section: post.category,
            authors: [post.author],
            tags: post.keywords,
        },
        twitter: {
            card: "summary_large_image",
            title: post.title,
            description: post.excerpt,
            images: [absoluteImage],
        },
    };
}

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;
    const post = blogPosts.find((p) => p.slug === slug);

    if (!post) {
        notFound();
    }

    const locale = await getRequestLocale();
    const canonicalUrl = localizedUrl(`/blog/${post.slug}`, locale);
    const publishedIso = toIsoDate(post.date);
    const heroImage = post.image.startsWith("http") ? post.image : `${BASE_URL}${post.image}`;
    const allImages = Array.from(new Set([heroImage, ...extractContentImages(post.content)]));
    const wordCount = estimateWordCount(post.content);

    const graph: Record<string, unknown>[] = [
        {
            "@type": "BlogPosting",
            "@id": `${canonicalUrl}#article`,
            headline: post.title,
            description: post.excerpt,
            image: allImages,
            datePublished: publishedIso,
            dateModified: publishedIso,
            articleSection: post.category,
            inLanguage: "en",
            wordCount,
            keywords: post.keywords?.join(", "),
            url: canonicalUrl,
            isAccessibleForFree: true,
            author: {
                "@type": "Organization",
                name: post.author,
                url: BASE_URL,
            },
            publisher: {
                "@type": "Organization",
                name: "Nilathra Collection",
                url: BASE_URL,
                logo: {
                    "@type": "ImageObject",
                    url: `${BASE_URL}/images/nilathra-logo.webp`,
                },
            },
            mainEntityOfPage: {
                "@type": "WebPage",
                "@id": canonicalUrl,
            },
            speakable: {
                "@type": "SpeakableSpecification",
                cssSelector: ["article h1", "article h2", "article h3", "article p"],
            },
        },
        {
            "@type": "BreadcrumbList",
            "@id": `${canonicalUrl}#breadcrumb`,
            itemListElement: [
                {
                    "@type": "ListItem",
                    position: 1,
                    name: "Home",
                    item: BASE_URL,
                },
                {
                    "@type": "ListItem",
                    position: 2,
                    name: "Blog",
                    item: `${BASE_URL}/blog`,
                },
                {
                    "@type": "ListItem",
                    position: 3,
                    name: post.title,
                    item: canonicalUrl,
                },
            ],
        },
    ];

    if (post.faq && post.faq.length > 0) {
        graph.push({
            "@type": "FAQPage",
            "@id": `${canonicalUrl}#faq`,
            mainEntity: post.faq.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: {
                    "@type": "Answer",
                    text: item.answer,
                },
            })),
        });
    }

    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": graph,
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <BlogContent post={post} />
        </>
    );
}
