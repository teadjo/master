import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(() => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      navigateFallback: '/index.html',
      navigateFallbackDenylist: [/^\/api/],
      includeAssets: ['**/*'],
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
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 10 
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              plugins: [
                {
                  handlerDidError: async () => {
                    return new Response(
                      JSON.stringify({ error: 'Offline' }),
                      { headers: { 'Content-Type': 'application/json' } }
                    )
                  }
                }
              ]
            }
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 dana
              }
            }
          },
          {
            urlPattern: ({ request }) =>
              request.destination === 'script' ||
              request.destination === 'style',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources'
            }
          },
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              networkTimeoutSeconds: 5
            }
          },
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              networkTimeoutSeconds: 5,
              plugins: [
                {
                  handlerDidError: async () => {
                    return caches.match('/offline.html')
                  }
                }
              ]
            }
          }
        ]
      }
    })
  ]
}))