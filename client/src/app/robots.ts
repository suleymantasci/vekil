import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',      // API routes
        '/dashboard/', // Authenticated pages
        '/admin/',     // Admin pages
      ],
    },
    sitemap: 'https://vekil.tasci.cloud/sitemap.xml',
    host: 'https://vekil.tasci.cloud',
  };
}