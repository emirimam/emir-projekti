// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Postavi SITE_URL u Vercel okruženju kad dobiješ pravu domenu.
const site = process.env.SITE_URL ?? 'https://emir-projekti.vercel.app';

export default defineConfig({
  site,
  i18n: {
    defaultLocale: 'bs',
    locales: ['bs', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  trailingSlash: 'always',
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'bs', locales: { bs: 'bs-BA', en: 'en-US' } },
      filter: (page) => !page.includes('/404'),
      lastmod: new Date(),
      changefreq: 'weekly',
    }),
  ],
  prefetch: { prefetchAll: true },
  build: { inlineStylesheets: 'auto' },
});
