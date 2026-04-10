import { MetadataRoute } from 'next';
import { blogPosts } from '@/data/blog-posts';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://www.nilathra.com';

    // Static routes
    const staticRoutes = [
        '',
        '/about',
        '/plans',
        '/plans/compare',
        '/plans/luxury',
        '/plans/premium',
        '/plans/regular',
        '/plans/ultra-vip',
        '/packages',
        '/for-vip',
        '/destinations',
        '/blog',
        '/careers',
        '/custom-plan',
        '/contact',
        '/reference',
        '/booking-conditions',
        '/privacy',
        '/terms'
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Dynamic destination routes
    const destinationSlugs = [
        "sigiriya", "galle", "ella", "yala", "kandy",
        "weligama-mirissa", "nuwara-eliya", "trincomalee", "colombo"
    ];

    const destinationRoutes = destinationSlugs.map((slug) => ({
        url: `${baseUrl}/destinations/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }));

    // Dynamic blog routes
    const blogRoutes = blogPosts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
    }));

    return [...staticRoutes, ...destinationRoutes, ...blogRoutes];
}
