import { MetadataRoute } from 'next';

// Define base URL for sitemap
const BASE_URL = 'https://vekil.tasci.cloud';

// Static pages
const staticPages = [
  { url: '', lastmod: '2026-05-10', priority: '1.0', changefreq: 'weekly' },
  { url: '/login', lastmod: '2026-05-10', priority: '0.8', changefreq: 'monthly' },
  { url: '/register', lastmod: '2026-05-10', priority: '0.8', changefreq: 'monthly' },
  { url: '/kvkk', lastmod: '2026-05-10', priority: '0.5', changefreq: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = staticPages.map((page) => ({
    url: `${BASE_URL}${page.url}`,
    lastModified: new Date(page.lastmod),
    changeFrequency: page.changefreq as any,
    priority: parseFloat(page.priority),
  }));

  return routes;
}