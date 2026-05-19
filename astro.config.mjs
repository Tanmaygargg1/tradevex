import { defineConfig } from 'astro/config';

// With a custom domain, base is always '' and site is your domain.
const SITE      = process.env.SITE      || 'https://tradevex.tanmaygarg.com';
const BASE_PATH = process.env.BASE_PATH || '';

export default defineConfig({
  site: SITE,
  base: BASE_PATH,
  output: 'static',
});
