// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Postavi SITE_URL u Vercel okruženju kad dobiješ pravu domenu.
const site = process.env.SITE_URL ?? 'https://emir-projekti.vercel.app';

export default defineConfig({
  site,
  integrations: [sitemap()],
  prefetch: { prefetchAll: true },
  build: { inlineStylesheets: 'auto' },
});
