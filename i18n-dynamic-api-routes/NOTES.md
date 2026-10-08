# Technical notes: with i18n, adapters can't route dynamic API routes

Facts for a bug report, not the report itself.

## Reproduction (this folder)

```bash
pnpm install
pnpm build    # adapter.mjs saves onBuildComplete's routing to routing.json
pnpm check    # resolves requests with @next/routing and that routing
```

- `next.config.mjs`: `i18n: { locales: ['en', 'fr'], defaultLocale: 'en' }` and `adapterPath: ./adapter.mjs`.
- `pages/api/hello.js` and `pages/api/blog/[slug].js`.
- Verified with `next@16.5.0-canary.4` and `@next/routing@16.5.0-canary.4` on Linux (WSL 2), Node.js 24.14.1.

## Actual (`pnpm check`)

```
dynamic routes: [{ "source": "/api/blog/[slug]",
  "sourceRegex": "^[/]?(?<nextLocale>[^/]{1,})/api/blog/(?<nxtPslug>[^/]+?)(?:/)?$",
  "destination": "/$nextLocale/api/blog/[slug]?nxtPslug=$nxtPslug" }]
/api/hello -> /api/hello
/api/blog/first -> (no match: 404)
/fr/api/blog/first -> /api/blog/[slug]
```

## Expected (`next start` on the same build)

```
/api/hello -> 200
/api/blog/first -> 200
/fr/api/blog/first -> 404
```

API routes aren't localized: `next start` serves `/api/blog/first` and not `/fr/api/blog/first`. Through the adapter routing it's the reverse.

## Cause

- The `routing.dynamicRoutes` given to adapters in `onBuildComplete` has a required `nextLocale` group in every dynamic route's `sourceRegex`, API routes included.
- `@next/routing` (`packages/next-routing/src/resolve-routes.ts`, the i18n step) deliberately doesn't prefix the locale for `/api/` and `/_next/` paths ("Skip locale handling for _next and api routes"), so an unprefixed API path never matches the regex.
- Static API routes work because they match `pathnames` exactly.
- Two ways to fix it: drop the locale group from dynamic API routes in the adapter routing output, or have `@next/routing` match them without it.

## When it started

- Bisected with this reproduction (`next` and `@next/routing` at the same version): `16.3.0` and `16.3.1-canary.15` route `/api/blog/first`; `16.3.1-canary.16` and later, including `16.4.0` and `16.5.0-canary.4`, don't.
- Between those two canaries, `2f84a1f28` "Revert i18n localization change for dynamic Pages API routes (#94905)" (vercel/next.js#97327, fixing vercel/next.js#96935) put the `nextLocale` group back into dynamic API routes' regex in `build-complete.ts`, to agree with Vercel's adapter, whose i18n rules prefix `/api/...` with the locale again (nextjs/adapter-vercel#101).
- `@next/routing` wasn't changed to match: it still skips the locale for `/api/` paths, so with the reverted output no unprefixed dynamic API path matches. The fix likely belongs in `@next/routing` (prefix the locale for `/api/` paths, as Vercel's adapter does), keeping the output that Vercel relies on.

## Impact

Every adapter that routes with `@next/routing` 404s dynamic API routes (`pages/api/.../[param].js`) in i18n apps. Seen in the deploy-mode tests `test/e2e/i18n-api-support` ("should respond to normal dynamic API request") and `test/e2e/i18n-basepath-fallback-false-404`.

## Existing reports

None found (searched `dynamic API route i18n adapter 404`, `@next/routing i18n api dynamic`, `nextLocale api route adapter`).
