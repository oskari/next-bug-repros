# Next.js bug reproductions

Minimal reproductions for two Next.js bugs, verified with `next@16.5.0-canary.2`. Each folder has a `NOTES.md` with the steps, the actual and expected results, and the cause.

- [`edge-route-cache-handlers`](edge-route-cache-handlers): an edge route handler with a custom `cacheHandlers` entry fails the Turbopack build (`Expected ';', '}' or <eof>` in `edge-app-route.js`); webpack builds it.
- [`i18n-dynamic-api-routes`](i18n-dynamic-api-routes): with `i18n`, the routing given to adapters requires a locale for dynamic API routes, so `@next/routing` can't match `/api/blog/first`, which `next start` serves.

```bash
cd <folder>
pnpm install
pnpm build
```
