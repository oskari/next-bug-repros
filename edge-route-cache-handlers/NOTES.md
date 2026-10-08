# Technical notes: edge route handler + custom `cacheHandlers` fails the Turbopack build

Facts for a bug report, not the report itself.

## Reproduction (this folder)

```bash
pnpm install
pnpm build              # fails
pnpm next build --webpack   # succeeds
```

- `next.config.js` sets `cacheHandlers: { default: './cache-handler.js' }` (a no-op handler; any custom entry triggers it).
- `app/api/edge/route.js` exports `runtime = 'edge'` and a `GET`.
- Verified with `next@16.5.0-canary.4` on Linux (WSL 2), Node.js 24.14.1. The bug is still in `canary` (checked on GitHub, October 8, 2026).

## Actual

```
> Build error occurred
Error: Turbopack build failed with 1 error:
./node_modules/.pnpm/next@16.5.0-canary.4_.../node_modules/next/dist/esm/build/templates/edge-app-route.js:22:12
Error: Expected ';', '}' or <eof>
Parsing ecmascript source code failed
```

## Expected

The build succeeds, as it does with webpack and with the same route on the Node.js runtime.

## Cause

- `crates/next-core/src/next_app/app_route_entry.rs`, `wrap_edge_route`, fills the template's `// INJECT_RAW:edgeCacheHandlersRegistration` with object entries:
  `cache_handler_map_entries.push_str(&format!("  {}: {cache_handler_var},\n", ...))` → `"default": cacheHandler0,`
- The template (`packages/next/src/build/templates/edge-app-route.ts`) has `const edgeCacheHandlers: any = {}` followed by that marker on its own line, so it expects statements.
- The webpack loader (`packages/next/src/build/webpack/loaders/next-edge-app-route-loader/index.ts`) emits statements: `edgeCacheHandlers["default"] = edgeCacheHandler_0`.
- The edge page entry (`app_page_entry.rs`) emits statements too: `cacheHandlers.setCacheHandler("default", cacheHandler0);`
- Introduced with `a6b36200f` ("Wire cache handlers in edge paths and add e2e regression coverage", vercel/next.js#91236). Its regression fixture `test/e2e/cache-handlers-upstream-wiring/fixtures/edge-without-cache-components` sets only `cacheHandler`, not `cacheHandlers`, so the Turbopack path for edge route handlers isn't covered.

## Likely fix

In `wrap_edge_route`, emit `edgeCacheHandlers[{kind}] = {var};\n` (with `serde_json::to_string(kind.as_str())` for the key), and add `cacheHandlers` to that fixture's `next.config.js`.

## Impact

Any app with an edge route handler and a custom `cacheHandlers` entry can't build with Turbopack, the default for `next build`. Deployment adapters that set `cacheHandlers` (for a shared `'use cache'` store) hit it for every app with an edge route handler.

## Existing reports

None found (searched `edgeCacheHandlers`, `edge-app-route cacheHandlers`, `cacheHandlers edge route Expected ';'`).
