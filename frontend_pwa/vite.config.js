import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
export default defineConfig(() => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      manifestFilename:'manifest.webmanifest',
      injectManifest: {
        injectionPoint: 'self.__WB_MANIFEST'
      },
      navigateFallback: '/index.html',
      navigateFallbackDenylist: [/^\/api/],
      includeAssets: ['favicon.svg',
                      'icons/192.png',
                      'icons/512.png',
                      'hero.webp'],
      manifest: {
        name: 'Art Competition App',
        short_name: 'ArtApp',
        description: 'Art competition platform',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        display_override: ["standalone", "minimal-ui"],
        orientation: 'portrait',
        categories: ['art', 'social'],
        lang: 'sr',
        prefer_related_applications: false,
        start_url: '/',
        scope: '/',
        shortcuts: [
          {
            name: "Takmičenja",
            short_name: "Takmičenja",
            description: "Pogledaj takmičenja",
            url: "/competitions",
            icons: [{ src: "/icons/192.png", sizes: "192x192" }]
          }
        ],
        icons: [
          {
            src: '/icons/192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },

      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        skipWaiting: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        globPatterns: ['**/*.{js,css,html,png,svg,ico,json,woff2,jpg}'],
      }
    })
  ],
  build: {
    cssMinify: true,
    cssCodeSplit: true,
    rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        'vendor-workbox': ['workbox-window'],
      }
    }
  }
  }
}))