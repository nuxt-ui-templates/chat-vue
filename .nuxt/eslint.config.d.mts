import type { FlatConfigComposer } from "../node_modules/.pnpm/eslint-flat-config-utils@2.1.4/node_modules/eslint-flat-config-utils/dist/index.mjs"
import { defineFlatConfigs } from "../node_modules/.pnpm/@nuxt+eslint-config@1.9.0_@typescript-eslint+utils@8.44.1_eslint@9.36.0_jiti@2.6.0__typ_deae94b7e16a28f9f7f8575c9d0b518e/node_modules/@nuxt/eslint-config/dist/flat.mjs"
import type { NuxtESLintConfigOptionsResolved } from "../node_modules/.pnpm/@nuxt+eslint-config@1.9.0_@typescript-eslint+utils@8.44.1_eslint@9.36.0_jiti@2.6.0__typ_deae94b7e16a28f9f7f8575c9d0b518e/node_modules/@nuxt/eslint-config/dist/flat.mjs"

declare const configs: FlatConfigComposer
declare const options: NuxtESLintConfigOptionsResolved
declare const withNuxt: typeof defineFlatConfigs
export default withNuxt
export { withNuxt, defineFlatConfigs, configs, options }