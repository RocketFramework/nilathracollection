import { MetadataRoute } from 'next';

const DISALLOWED = ['/admin/', '/admin-new/', '/tourist/', '/api/'];

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: DISALLOWED,
            },
            {
                userAgent: [
                    'GPTBot',
                    'OAI-SearchBot',
                    'ChatGPT-User',
                    'ClaudeBot',
                    'Claude-Web',
                    'PerplexityBot',
                    'Google-Extended',
                    'Applebot-Extended',
                ],
                allow: ['/', '/blog/', '/llms.txt', '/llms-full.txt', '/blog/feed.xml'],
                disallow: DISALLOWED,
            },
        ],
        sitemap: 'https://www.nilathra.com/sitemap.xml',
        host: 'https://www.nilathra.com',
    };
}
