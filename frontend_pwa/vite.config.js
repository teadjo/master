import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(() => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // KLJUČNO: Koristi injectManifest za custom SW
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
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
        // NE MIJENJAJ runtimeCaching - ovo će biti u sw.js
      }
    })
  ]
}))