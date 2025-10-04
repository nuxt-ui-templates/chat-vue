import { defineConfig } from 'vite'
import path from 'path'
import { nitro } from 'nitro/vite'
import vue from '@vitejs/plugin-vue'
import vueRouter from 'unplugin-vue-router/vite'
import vueLayouts from 'vite-plugin-vue-layouts'

import ui from '@nuxt/ui/vite'
import vueDevtools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vueRouter(),
    vueLayouts(),
    vue(),
    ui({
      ui: {
        colors: {
          primary: 'blue',
          neutral: 'neutral'
        }
      }
    }),
    nitro({
      config: {
        // srcDir: './server/',
      }
    }),
    vueDevtools()
  ],
  // https://github.com/nuxt-content/mdc#stub-nuxt-module-imports
  resolve: {
    alias: {
      '#mdc-imports': path.resolve(__dirname, './stub-mdc-imports.js'),
      '#mdc-configs': path.resolve(__dirname, './stub-mdc-imports.js'),
    }
  }
})
