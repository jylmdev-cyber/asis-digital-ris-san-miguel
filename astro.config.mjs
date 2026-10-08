// @ts-check
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// URL pública y subcarpeta. Para GitHub Pages de proyecto: SITE=https://<usuario>.github.io  BASE=/<repositorio>/
// Para Cloudflare Pages o dominio propio: BASE=/
const SITE = process.env.SITE || 'https://jylmdev-cyber.github.io';
const BASE = process.env.BASE ?? '/asis-digital-ris-san-miguel/';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  output: 'static',
  integrations: [vue(), sitemap()],
  vite: { plugins: [tailwindcss()] },
  build: { inlineStylesheets: 'auto' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
