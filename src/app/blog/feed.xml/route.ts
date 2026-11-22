import { NextResponse } from "next/server";
import { blogPosts } from "@/data/blog-posts";

const BASE_URL = "https://www.nilathra.com";

export const dynamic = "force-static";

function escapeXml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function getMimeType(imagePath: string): string {
    if (imagePath.endsWith(".webp")) return "image/webp";
    if (imagePath.endsWith(".avif")) return "image/avif";
    if (imagePath.endsWith(".png")) return "image/png";
    return "image/jpeg";
}

export async function GET() {
    const items = blogPosts
        .map((post) => {
            const url = `${BASE_URL}/blog/${post.slug}`;
            const imageUrl = post.image.startsWith("http") ? post.image : `${BASE_URL}${post.image}`;
            const parsed = new Date(post.date);
            const pubDate = Number.isNaN(parsed.getTime()) ? new Date().toUTCString() : parsed.toUTCString();
            return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(post.category)}</category>
      <author>concierge@nilathra.com (${escapeXml(post.author)})</author>
      <description>${escapeXml(post.excerpt)}</description>
      <enclosure url="${escapeXml(imageUrl)}" type="${getMimeType(post.image)}" length="0" />
    </item>`;
        })
        .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Nilathra Journal — Sri Lanka Travel, Culture &amp; Gastronomy</title>
    <link>${BASE_URL}/blog</link>
    <description>Luxury travel guides, authentic Sri Lankan cuisine, wildlife safaris, and cultural insights by Nilathra Collection.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/blog/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

    return new NextResponse(xml, {
        headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
        },
    });
}
