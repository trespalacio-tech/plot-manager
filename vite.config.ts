import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

const APP_BASE = process.env.BASE_URL ?? '/';

export default defineConfig({
  base: APP_BASE,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'favicon.ico',
        'apple-touch-icon-180x180.png',
      ],
      manifest: {
        id: APP_BASE,
        name: 'Fincas — Gestión regenerativa',
        short_name: 'Fincas',
        description:
          'App local-first para gestión regenerativa de frutales y viñedo. Sin servidor, sin cuentas, sin internet obligatorio.',
        theme_color: '#2f6b3a',
        background_color: '#fbf9f5',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'es',
        // El query identifica accesos lanzados desde el icono PWA y
        // permite distinguirlos en logs/diagnóstico (vivimos en hash
        // router, así que el query no afecta a la SPA).
        start_url: `${APP_BASE}?source=pwa`,
        scope: APP_BASE,
        categories: ['productivity', 'utilities', 'lifestyle'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        cleanupOutdatedCaches: true,
        importScripts: ['sw-coach.js'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.hostname.endsWith('tile.openstreetmap.org'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: {
                maxEntries: 2000,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
