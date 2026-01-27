import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  publicDir: 'public',
  server: {
    fs: {
      allow: ['.'],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-antd': ['antd', '@ant-design/icons'],
          'vendor-charts': ['recharts'],
          'vendor-utils': ['zustand', 'fuse.js', 'i18next', 'react-i18next'],
        },
      },
    },
    // Improve chunk size warnings
    chunkSizeWarningLimit: 500,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'Araç Fiyat Listesi',
        short_name: 'Fiyat Listesi',
        description: 'Türkiye araç fiyat karşılaştırma ve analiz platformu',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/price-list/',
        scope: '/price-list/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/data\/.*\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'price-data-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
          {
            urlPattern: /\/data\/index\.json$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'index-cache',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
            },
          },
        ],
      },
    }),
  ],
  base: '/price-list/',
});
