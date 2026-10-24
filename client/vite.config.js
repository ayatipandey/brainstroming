import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { BRAND, missingBusinessFields } from '../shared/brand.config.js';

// Business details must come from company records. A production build stops
// with a list of what is missing; dev builds show it in a banner instead.
function businessDetailsCheck() {
  return {
    name: 'business-details-check',
    configResolved(config) {
      const missing = missingBusinessFields();
      if (!missing.length) return;
      const msg = `Missing business details in shared/brand.config.js: ${missing.join(', ')}`;
      if (config.command === 'build' && process.env.ALLOW_MISSING_BUSINESS_DETAILS !== '1') {
        throw new Error(`${msg}. Fill them in, or set ALLOW_MISSING_BUSINESS_DETAILS=1 for an internal preview build.`);
      }
      config.logger.warn(`\n  ${msg}\n`);
    },
    transformIndexHtml(html) {
      return html.replaceAll('%BRAND_NAME%', BRAND.name).replaceAll('%BRAND_TAGLINE%', BRAND.tagline);
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [react(), businessDetailsCheck()],
  define: {
    __MISSING_BUSINESS__: JSON.stringify(missingBusinessFields()),
    // The team's simulator exists only in dev, or when ENABLE_DEV_TOOLS=1.
    __DEV_TOOLS__: JSON.stringify(command === 'serve' || process.env.ENABLE_DEV_TOOLS === '1'),
  },
  resolve: {
    alias: { '@shared': fileURLToPath(new URL('../shared', import.meta.url)) },
  },
  server: {
    port: 5173,
    fs: { allow: ['..'] },
    proxy: { '/api': 'http://localhost:3001' },
  },
  build: { chunkSizeWarningLimit: 700 },
}));
