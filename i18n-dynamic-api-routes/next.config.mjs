import { fileURLToPath } from 'node:url'

export default {
  i18n: { locales: ['en', 'fr'], defaultLocale: 'en' },
  adapterPath: fileURLToPath(new URL('./adapter.mjs', import.meta.url)),
}
