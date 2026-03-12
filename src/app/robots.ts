import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
        },
        sitemap: 'https://nilathra.com/sitemap.xml',
        host: 'https://nilathra.com',
    };
}
