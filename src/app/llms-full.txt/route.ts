import { NextResponse } from "next/server";
import { blogPosts } from "@/data/blog-posts";

const BASE_URL = "https://www.nilathra.com";

export const dynamic = "force-static";

function cleanMarkdownForLlm(content: string): string {
    return content
        .replace(/<figure[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>[\s\S]*?<\/figure>/gi, (_m, src, alt) => `![${alt}](${BASE_URL}${src})`)
        .replace(/<[^>]+>/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

export async function GET() {
    const sections = [
        "# Nilathra Collection — Full Editorial & Travel Journal Index (llms-full.txt)",
        "",
        "> Machine-readable full-text corpus of Nilathra Collection's Sri Lanka travel, culinary, culture, wildlife, and luxury guides.",
        `> Website: ${BASE_URL}`,
        `> Blog Index: ${BASE_URL}/blog`,
        `> RSS Feed: ${BASE_URL}/blog/feed.xml`,
        `> Sitemap: ${BASE_URL}/sitemap.xml`,
        "",
        "---",
        "",
    ];

    for (const post of blogPosts) {
        sections.push(`## ${post.title}`);
        sections.push(`- URL: ${BASE_URL}/blog/${post.slug}`);
        sections.push(`- Category: ${post.category}`);
        sections.push(`- Published: ${post.date}`);
        sections.push(`- Author: ${post.author}`);
        sections.push(`- Cover Image: ${BASE_URL}${post.image}`);
        if (post.keywords?.length) {
            sections.push(`- Keywords: ${post.keywords.join(", ")}`);
        }
        sections.push(`- Summary: ${post.excerpt}`);
        sections.push("");
        sections.push(cleanMarkdownForLlm(post.content));
        if (post.faq?.length) {
            sections.push("");
            sections.push("### Frequently Asked Questions");
            for (const item of post.faq) {
                sections.push(`**Q: ${item.question}**`);
                sections.push(`A: ${item.answer}`);
                sections.push("");
            }
        }
        sections.push("");
        sections.push("---");
        sections.push("");
    }

    return new NextResponse(sections.join("\n"), {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
        },
    });
}
