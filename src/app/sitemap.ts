import { MetadataRoute } from 'next';
import { blogPosts } from '@/data/blog-posts';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://www.nilathra.com';
    const locales = ['en', 'de', 'fr'];

    // Static routes with individual priorities & update frequencies
    const staticRoutesConfig: Array<{ path: string; priority: number; changeFreq: 'daily' | 'weekly' | 'monthly' }> = [
        { path: '', priority: 1.0, changeFreq: 'daily' },
        { path: '/for-vip', priority: 0.95, changeFreq: 'weekly' },
        { path: '/plans/ultra-vip', priority: 0.95, changeFreq: 'weekly' },
        { path: '/custom-plan', priority: 0.95, changeFreq: 'weekly' },
        { path: '/destinations', priority: 0.90, changeFreq: 'weekly' },
        { path: '/plans', priority: 0.90, changeFreq: 'weekly' },
        { path: '/about', priority: 0.85, changeFreq: 'monthly' },
        { path: '/elite-journeys', priority: 0.85, changeFreq: 'monthly' },
        { path: '/imperial-helicopter', priority: 0.85, changeFreq: 'monthly' },
        { path: '/wild-ceylon', priority: 0.85, changeFreq: 'monthly' },
        { path: '/plans/luxury', priority: 0.80, changeFreq: 'monthly' },
        { path: '/plans/premium', priority: 0.80, changeFreq: 'monthly' },
        { path: '/plans/regular', priority: 0.80, changeFreq: 'monthly' },
        { path: '/plans/compare', priority: 0.80, changeFreq: 'monthly' },
        { path: '/contact', priority: 0.80, changeFreq: 'monthly' },
        { path: '/blog', priority: 0.80, changeFreq: 'weekly' },
        { path: '/testimonials/david-montgomery', priority: 0.85, changeFreq: 'monthly' },
        { path: '/testimonials/dr-julian-clara-von-berg', priority: 0.85, changeFreq: 'monthly' },
        { path: '/careers', priority: 0.50, changeFreq: 'monthly' },
        { path: '/reference', priority: 0.50, changeFreq: 'monthly' },
        { path: '/booking-conditions', priority: 0.40, changeFreq: 'monthly' },
        { path: '/privacy', priority: 0.30, changeFreq: 'monthly' },
        { path: '/terms', priority: 0.30, changeFreq: 'monthly' },
    ];

    const staticRoutes: MetadataRoute.Sitemap = [];

    staticRoutesConfig.forEach((item) => {
        locales.forEach((lang) => {
            const pathWithLang = lang === 'en' ? item.path : `/${lang}${item.path}`;
            staticRoutes.push({
                url: `${baseUrl}${pathWithLang}`,
                lastModified: new Date(),
                changeFrequency: item.changeFreq,
                priority: item.priority,
                alternates: {
                    languages: {
                        en: `${baseUrl}${item.path}`,
                        de: `${baseUrl}/de${item.path}`,
                        fr: `${baseUrl}/fr${item.path}`,
                    },
                },
            });
        });
    });

    // Dynamic destination routes (All 9 Sri Lanka Destinations across all languages)
    const destinationSlugs = [
        "sigiriya", "galle", "ella", "yala", "kandy",
        "weligama-mirissa", "nuwara-eliya", "trincomalee", "colombo"
    ];

    const destinationRoutes: MetadataRoute.Sitemap = [];

    destinationSlugs.forEach((slug) => {
        locales.forEach((lang) => {
            const relPath = `/destinations/${slug}`;
            const pathWithLang = lang === 'en' ? relPath : `/${lang}${relPath}`;
            destinationRoutes.push({
                url: `${baseUrl}${pathWithLang}`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.85,
                alternates: {
                    languages: {
                        en: `${baseUrl}${relPath}`,
                        de: `${baseUrl}/de${relPath}`,
                        fr: `${baseUrl}/fr${relPath}`,
                    },
                },
            });
        });
    });

    // Dynamic blog routes (All 19+ Articles across all languages)
    const blogRoutes: MetadataRoute.Sitemap = [];

    blogPosts.forEach((post) => {
        locales.forEach((lang) => {
            const relPath = `/blog/${post.slug}`;
            const pathWithLang = lang === 'en' ? relPath : `/${lang}${relPath}`;
            blogRoutes.push({
                url: `${baseUrl}${pathWithLang}`,
                lastModified: new Date(post.date),
                changeFrequency: 'monthly',
                priority: 0.70,
                alternates: {
                    languages: {
                        en: `${baseUrl}${relPath}`,
                        de: `${baseUrl}/de${relPath}`,
                        fr: `${baseUrl}/fr${relPath}`,
                    },
                },
            });
        });
    });

    return [...staticRoutes, ...destinationRoutes, ...blogRoutes];
}
