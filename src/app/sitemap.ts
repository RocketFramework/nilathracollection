import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://nilathra.com';

    // In a real scenario, you'd fetch routes or packages from a DB
    // For now, we'll include the main static routes
    const routes = [
        '',
        '/about',
        '/packages',
        '/destinations',
        '/custom-plan',
        '/contact',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    return routes;
}
