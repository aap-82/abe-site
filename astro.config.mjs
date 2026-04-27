import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://abeeducation.edu.au',
  output: 'static',

  integrations: [
    mdx(),
    sitemap({
      i18n: { defaultLocale: 'en-AU', locales: { 'en-AU': 'en-AU' } },
      changefreq: 'weekly',
      priority: 0.7
    })
  ],

  // ── Built-in Fonts API (Astro 6) ───────────────────────────
  // Replaces the manual Google Fonts <link> in BaseLayout.
  // Astro downloads font files at build time, self-hosts them,
  // and generates optimised fallbacks + preload links automatically.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'DM Sans',
      cssVariable: '--font-sans',
      weights: [400, 500, 600],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext']
    },
    {
      provider: fontProviders.google(),
      name: 'Archivo',
      cssVariable: '--font-display',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext']
    },
    {
      provider: fontProviders.google(),
      name: 'DM Mono',
      cssVariable: '--font-mono',
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin']
    }
  ],

  // ── Content Security Policy (stable in Astro 6.1) ───────────
  // Auto-hashes scripts and styles, generates CSP <meta> tags.
  // Covers our schema JSON-LD blocks and any future inline styles.
  security: {
    csp: true
  },

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: cloudflare()
});