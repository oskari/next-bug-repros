// Resolves requests with @next/routing and the routing Next.js gave the adapter.
import fs from 'node:fs'
import nextRouting from '@next/routing'

const { resolveRoutes } = nextRouting

const { routing, pathnames, buildId, i18n } = JSON.parse(
  fs.readFileSync('routing.json', 'utf8')
)
console.log('dynamic routes:', JSON.stringify(routing.dynamicRoutes, null, 2))

for (const pathname of ['/api/hello', '/api/blog/first', '/fr/api/blog/first']) {
  const result = await resolveRoutes({
    url: new URL(pathname, 'http://localhost:3000'),
    buildId,
    basePath: '',
    i18n,
    headers: new Headers(),
    requestBody: new ReadableStream({ start: (c) => c.close() }),
    pathnames,
    routes: routing,
    invokeMiddleware: async () => ({}),
  })
  console.log(pathname, '->', result.resolvedPathname ?? '(no match: 404)')
}
