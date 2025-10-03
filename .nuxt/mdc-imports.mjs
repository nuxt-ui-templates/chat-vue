import _RemarkEmoji from 'remark-emoji'
import _Highlight from '/Users/atinux/Projects/nuxt-ui-templates/chat-vue/node_modules/.pnpm/@nuxtjs+mdc@0.17.4_magicast@0.3.5/node_modules/@nuxtjs/mdc/dist/runtime/highlighter/rehype-nuxt.js'

export const remarkPlugins = {
  'remark-emoji': { instance: _RemarkEmoji },
}

export const rehypePlugins = {
  'highlight': { instance: _Highlight, options: {} },
}

export const highlight = {"theme":{"light":"material-theme-lighter","default":"material-theme","dark":"material-theme-palenight"}}