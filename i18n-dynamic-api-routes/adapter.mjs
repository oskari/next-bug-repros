// Saves what an adapter gets in onBuildComplete for check.mjs.
import fs from 'node:fs'

export default {
  name: 'routing-dump',
  async onBuildComplete({ routing, outputs, buildId, config }) {
    const pathnames = [...outputs.pages, ...outputs.pagesApi].map(
      (output) => output.pathname
    )
    fs.writeFileSync(
      'routing.json',
      JSON.stringify({ routing, pathnames, buildId, i18n: config.i18n }, null, 2)
    )
  },
}
