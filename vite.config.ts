import { defineConfig } from 'vite'
import { nitro } from 'nitro/vite'
import vue from '@vitejs/plugin-vue'
import vueRouter from 'vue-router/vite'
import vueLayouts from 'vite-plugin-vue-layouts'
import vueDevtools from 'vite-plugin-vue-devtools'
import ui from '@nuxt/ui/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vueRouter({
      dts: 'src/route-map.d.ts'
    }),
    vueLayouts(),
    vueDevtools(),
    vue(),
    ui({
      prose: true,
      ui: {
        colors: {
          primary: 'blue',
          neutral: 'zinc'
        }
      }
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      outDir: '.output/public',
      includeAssets: [
        'logo.svg',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'icon-maskable-512.png'
      ],
      manifest: {
        name: 'Agent Platform — Hermes Agent',
        short_name: 'Agent Platform',
        description: 'Agent Platform: voice-first home for Hermes Agent. Hold-to-talk AI chat with top-tier models, persistent memory, and deep research.',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        orientation: 'any',
        start_url: '/',
        scope: '/',
        categories: ['productivity', 'utilities'],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
        ]
      },
      workbox: {
        globDirectory: '.output/public',
        globIgnores: [
          '**/assets/yaml-*.js',
          '**/assets/elk.bundled-*.js',
          'hermes-bg.png',
          'hermes-agent-green.png',
          'hermes3.png',
          'Nous_Research_launches_Hermes_Agent-800w.jpg',
          'Screenshot*.png'
        ],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/api\//, /^\/auth\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.bunny.net',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'bunny-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && /\.(png|jpg|jpeg|webp|svg)$/.test(url.pathname),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    }),
    nitro({
      serverDir: './server'
    })
  ]
})
