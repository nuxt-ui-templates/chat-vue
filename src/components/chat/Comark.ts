import { defineComarkComponent } from '@comark/vue'
import highlight from '@comark/vue/plugins/highlight'

export default defineComarkComponent({
  name: 'ChatComark',
  plugins: [highlight()]
})
