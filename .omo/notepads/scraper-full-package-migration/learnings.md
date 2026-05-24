# Learnings

## 2026-05-24 Task: dependency drift guard
- Keep Rslib/Rstest version bumps scoped to the package that actually needs them; do not upgrade `@rslib/core`, `@rstest/adapter-rslib`, or `@rstest/core` together across unrelated workspace packages during lightweight fixes.
- When preserving a provider-url-only fix, restore package toolchain versions first, then refresh `pnpm-lock.yaml`, so app builds fail or pass for the right reason.
- For `apps/danmu-universe`, do not add `@rstest/adapter-rslib` while the app stays on `@rslib/core@0.18.2`; keep the app on plain `@rstest/core` instead.

## 2026-05-20 Task: final verification wave
- F1 plan compliance, F2 code quality, F3 manual QA, and F4 scope fidelity all returned `APPROVE` in read-only final-wave review sessions.
- Per plan rules, F1-F4 remain unchecked until the user explicitly says "okay" after the consolidated results are presented.

## 2026-05-20 Task: final cleanup verification
- `packages/scraper-kit/src/scrapers/bilibili/dm.proto.d.ts` is generated/ignored but still required for scraper-kit declaration generation; removing it makes `pnpm --filter @forward-widget/scraper-kit build` fail on the `./dm.proto` import.
- `packages/tmdb-mapping-kit` needs a TypeScript project reference to `../scraper-kit` so Rslib declaration generation resolves migrated scraper-kit workspace types reliably.
- For concise root Turbo verification, run `pnpm exec turbo run build --output-logs=errors-only`; passing `--output-logs` through `pnpm build -- ...` incorrectly forwards it to package build scripts.
- When `danmu-universe` consumes a new workspace package at runtime, add the package to both `package.json` dependencies and `tsconfig.json` references; direct Rslib builds rely on the reference to resolve the workspace package consistently.

## 2026-05-19 Task: session-start
- Active plan: `.sisyphus/plans/scraper-full-package-migration.md`.
- Corrected target is full scraper implementation migration, not parser-only extraction.
- `packages/scraper-kit` must own scraper base/config/provider folders/proto assets plus pure provider ID/URL utilities.
- `apps/danmu-universe/src/scrapers/index.ts` should end as a thin compatibility shim importing package factory.
- `tmdb-mapping-kit` should import only pure APIs from `@forward-widget/scraper-kit`; Bilibili `ep` lookup remains in mapping kit.

## 2026-05-19 Task: scraper-kit package shape
- `packages/scraper-kit/package.json` now follows the dist-first single-root export shape: `exports["."].types` points to `./dist/index.d.ts`, `exports["."].import` points to `./dist/index.js`, and provider utility modules remain reachable through `src/index.ts` re-exports rather than subpath exports.
- `querystringify` is a runtime dependency for current scraper-kit source; Rslib/Rstest/TypeScript and type packages remain dev dependencies.

## 2026-05-19 Task: scraper-kit runtime support
- Current scraper helper imports require package-local runtime exports for `Fetch`/`fetch` plus `HttpResponse`/`RequestOptions`, `Logger`, configured `z`, `DEFAULT_COLOR_HEX`, `DEFAULT_COLOR_INT`, `MediaType`, `searchDanmuParamsSchema`, `TTL_1_DAY`, `TTL_2_HOURS`, `safeJsonParse`, `safeJsonParseWithZod`, `base64ToUint8Array`, and `generateUUID`.
- `packages/scraper-kit/src/runtime/*` now owns these helpers directly; `fetch` and cache storage use package-local `Widget` boundary declarations instead of app-local `apps/danmu-universe/src/libs/*` or workspace helper packages.

## 2026-05-19 Task: scraper-kit runtime support verification fix
- `Fetch`/`Storage` runtime helpers now use explicit `HttpClient` and `StorageClient` adapter interfaces plus `createFetch(httpClient, storageClient?)` and `createStorage(storageClient)` factories; package code no longer reads or declares `Widget`.
- The package root exports the injectable runtime surface (`HttpClient`, `HttpClientOptions`, `StorageClient`, `Fetch`, `Storage`, `createFetch`, `createStorage`) so later scraper moves can receive app-provided clients instead of importing app-local globals.

## 2026-05-19 Task: runtime dependency correction
- User correctly rejected the custom fetch/storage runtime rewrite because `apps/danmu-universe/src/libs/fetch.ts` and `storage.ts` already re-export `@forward-widget/libs-fetch` and `@forward-widget/libs-storage`.
- Final direction: `packages/scraper-kit/src/runtime/fetch.ts` and `storage.ts` are thin re-exports of those existing packages; scraper-kit owns only the missing helper surfaces such as logger/zod/constants/utils.
- `packages/scraper-kit/src/scrapers/base.ts` now uses `Fetch` via scraper-kit runtime, which resolves to `@forward-widget/libs-fetch`.

## 2026-05-19 Task: migration guard tests
- `packages/scraper-kit/src/provider-id.test.ts` now locks `parseProviderIdString` examples for all six providers alongside existing generation examples, with Renren numeric parsing preserved.
- Existing `provider-url.test.ts` already guards direct URL behavior for all six providers, including Bilibili `ep` returning `null` and Renren remaining conservative/null without direct URL evidence.
- Targeted app scraper ID compatibility test passed unchanged and continues to cover all six app scraper ID string round trips.

## 2026-05-20 Task: move scraper core
- Shared non-provider scraper core now lives under `packages/scraper-kit/src/scrapers`; package code imports provider ID helpers from `../provider-id` and runtime helpers/types from `../runtime` rather than app `src/libs`.
- Because provider folders remain app-side for Task 4, `apps/danmu-universe/src/scrapers/base.ts` is a temporary adapter shim that injects the app `Fetch` into package `BaseScraper`; blacklist/config/parse shims are direct package re-exports.
- `BaseScraper` no longer constructs `new Fetch()` in package code. It requires a `BaseScraperRuntime` with an injected fetch-compatible object, preserving the Task 2 no-global-Widget boundary.

## 2026-05-20 Task: runtime dependency correction
- Final runtime dependency direction: scraper-kit must re-export/use existing `@forward-widget/libs-fetch` and `@forward-widget/libs-storage` for Fetch, HTTP response/request types, cache storage, and TTL constants.
- `apps/danmu-universe/src/libs/fetch.ts` and `apps/danmu-universe/src/libs/storage.ts` are already thin re-exports of those packages, so scraper-kit should align with them rather than recreate fetch/storage behavior.
- Rslib package dependencies need corresponding `workspace:^` entries plus refreshed `pnpm-lock.yaml`; building storage before fetch may be necessary when dist declarations are missing.

## 2026-05-20 Task: move provider implementations
- Provider folders `tencent`, `youku`, `iqiyi`, `bilibili`, `renren`, and `mgtv` now live under `packages/scraper-kit/src/scrapers`; app provider files are temporary shims re-exporting `@forward-widget/scraper-kit`.
- Bilibili `dm.proto` must be built in scraper-kit with `rsbuild-plugin-protobufjs`; scraper-kit bundles provider dependencies (`bundle: true`, `autoExternal: false`) to avoid ESM/CJS interop failure from `protobufjs/minimal` when importing the package root.
- Moved providers need `BaseScraper` to provide a default scraper-kit runtime `Fetch` so existing no-argument provider constructors and app shims remain compatible before Task 7.

## 2026-05-20 Task: move provider implementations verification fix
- Scraper-kit default tests must exclude live provider specs and in-source provider `import.meta.rstest` blocks; deterministic coverage remains in provider ID/URL/public API tests.
- After moving providers, live/manual provider QA should stay app/manual-side because runtime calls require Forward `Widget` storage/fetch globals and external provider networks.

## 2026-05-20 Task: move provider implementations browser-build fix
- Scraper-kit provider dist needs targeted bundling: bundle Bilibili `dm.proto`/`protobufjs` and `url-parse` for root ESM interop, but externalize browser-safe dependencies like `crypto-js` to avoid top-level Node `crypto` imports in package dist.
- When scraper-kit Rslib output target is `web`, set Rstest `testEnvironment: "node"` for deterministic package tests to avoid an implicit `happy-dom` dependency.

## 2026-05-20 Task: registry factory extraction
- `packages/scraper-kit/src/scrapers/index.ts` now owns `createScraperRegistry()` and returns both the provider instance array and typed `scraperMap` with the six current provider keys: `tencent`, `youku`, `iqiyi`, `bilibili`, `renren`, and `mgtv`.
- `apps/danmu-universe/src/scrapers/index.ts` can stay as the app-side compatibility wrapper by assigning `registry.scrapers` and `registry.scraperMap`, while app-only `LITE_VERSION`, OpenCC, and global param behavior remains outside scraper-kit.

## 2026-05-20 Task: danmu consumes scraper-kit
- `apps/danmu-universe/src/scrapers/index.ts` remains the app orchestration wrapper and now consumes `createScraperRegistry` from `@forward-widget/scraper-kit`; provider folders are one-line compatibility re-export shims to the package.
- `@forward-widget/scraper-kit` belongs in `apps/danmu-universe` runtime dependencies because app source imports package registry/providers directly.
- `packages/tmdb-mapping-kit` already stays on the pure `@forward-widget/scraper-kit` root API (`parseProviderUrl`) with no runtime/class imports; Bilibili episode lookup remains local to mapping-kit.
- Existing tests already cover Bilibili `ep` lookup, Bilibili `ss` direct parsing, MGTV direct parsing, and unsupported-provider fallback.


## 2026-05-20 Task: regression tests
- `packages/scraper-kit/src/index.test.ts` now exercises the migrated public root export, `createScraperRegistry().scraperMap` provider keys, provider instance availability, scraper array ordering, and deterministic `parseEpNumber` behavior without calling live provider methods.
- `apps/danmu-universe/src/scrapers/id-string-compat.spec.ts` now imports the app shim singleton and verifies its `scraper.scraperMap` exposes the package provider set and package-compatible ID generation.
- Existing `tmdb-mapping-kit` regression tests still cover deterministic fallback, Bilibili `ep`, Bilibili `ss`, and MGTV URL paths with mocked `fetchImpl` only.

## 2026-05-24 Task: async provider URL parser refactor
- `BaseScraper` now owns provider ID string parse/generate and exposes async `parseProviderUrl(url, options)` so provider classes own URL parsing behavior instead of central switch logic in `provider-url.ts`.
- `provider-url.ts` is now an async compatibility facade over `createScraperRegistry().scrapers`; all app and tmdb callers must `await parseProviderUrl(...)`.
- Bilibili `ep` URLs resolve through `BilibiliScraper.getPgcSeasonId`; pass `{ fetch }` for Node/test callers such as `tmdb-mapping-kit`, otherwise scraper-kit uses existing `@forward-widget/libs-fetch` through the scraper runtime.
- Targeted verification passed: scraper-kit test/build, tmdb-mapping-kit test/build, danmu id-string compatibility test, and danmu build. Biome LSP still exits with code -2; CLI biome only reports existing parseInt radix infos in `apps/danmu-universe/src/matchers/douban.ts`.

## 2026-05-24 Task: fetch adapter initialization
- Per user direction, `parseProviderUrl` no longer accepts a per-call `{ fetch }` option. Bilibili `ep` parsing uses `BilibiliScraper` and its `Fetch` runtime.
- `@forward-widget/libs-fetch` no longer exports a `fetch = new Fetch()` singleton; it exposes `initializeFetchAdapter` and `initializeFetchStorageAdapter`, so each runtime owns adapter setup.
- `apps/danmu-universe/src/libs/fetch.ts` initializes adapters from `Widget.http` and `@forward-widget/libs-storage`; `apps/danmu-universe/src/index.ts` imports this wrapper first to guarantee initialization before scraper usage.
- `packages/tmdb-mapping-kit` initializes the fetch adapter from its existing `fetchImpl` before deterministic provider URL resolution, keeping Node/test behavior isolated from scraper-kit API.
- Add TS project references to workspace package consumers (`scraper-kit -> fetch/storage`, `tmdb-mapping-kit -> fetch/scraper-kit`) so Rslib declaration generation resolves workspace declarations reliably. Avoid running dependent package declaration builds in parallel with their dependency build, because `dist/index.d.ts` can race.

## 2026-05-24 Task: fetch adapter initialization
- User rejected passing `{ fetch }` through `parseProviderUrl`; `@forward-widget/libs-fetch` now exposes adapter initialization instead of exporting a singleton `fetch = new Fetch()`.
- `Fetch` now routes HTTP through `initializeFetchAdapter(...)` and optional cache through `initializeFetchStorageAdapter(...)`; if no storage adapter is initialized, cache reads/writes are skipped instead of touching `Widget.storage`.
- `apps/danmu-universe/src/libs/fetch.ts` initializes the adapters with `Widget.http` and `@forward-widget/libs-storage`; `apps/danmu-universe/src/index.ts` imports this module before scraper/runtime usage.
- `packages/tmdb-mapping-kit` initializes the scraper-kit exported fetch adapter from its local `fetchImpl`, then calls `parseProviderUrl(platformUrl)` with no function-level fetch option.
- Declaration builds need project references from scraper-kit to `../fetch`/`../storage` and from tmdb-mapping-kit to `../fetch`/`../scraper-kit`; tmdb build should run after scraper-kit build to avoid dist race.

## 2026-05-24 Task: fetch constructor options
- `Fetch` constructor no longer takes positional `cookie` and `headers` params; use `new Fetch({ cookie, headers, adapter, storageAdapter })` for explicit instance state, while existing no-arg `new Fetch()` remains valid.
- Instance-level `adapter` and `storageAdapter` override the module-level initialized adapters, which keeps tests/Node runtimes injectable without reintroducing per-call provider URL fetch options.

## 2026-05-24 Task: fetch options export surface
- `FetchOptions` is now re-exported through `packages/scraper-kit/src/runtime/fetch.ts`, `packages/scraper-kit/src/runtime/index.ts`, and `packages/scraper-kit/src/index.ts` so package consumers can import the constructor options type from the scraper-kit root API.

## 2026-05-24 Task: fetch adapter state ownership
- Adapter defaults must live inside the `Fetch` class, not as module-level `let` state in `packages/fetch/src/index.ts`; exported initializer functions should only delegate to `Fetch.initializeAdapter(...)` and `Fetch.initializeStorageAdapter(...)`.

## 2026-05-24 Task: fetch timeout removal
- `RequestOptions` must not expose `timeout` because the widget core runs in JavaScriptCore where `setTimeout` is unavailable; `packages/fetch/src/index.ts` should not implement timeout racing or call `setTimeout`.

## 2026-05-24 Task: JavaScriptCore fetch options
- `RequestOptions` in `@forward-widget/libs-fetch` must not expose `timeout`; core code runs under JavaScriptCore where `setTimeout` is unavailable, so timeout behavior should not be implemented or advertised in the shared fetch API.

## 2026-05-24 Task: tmdb mapping fixed fetch usage
- `packages/tmdb-mapping-kit` should not pass `fetchImpl` through public/internal functions; initialize the scraper-kit fetch adapter from the fixed runtime `fetch` at `runMappingAgent` entry and let `fetchTmdbMetadata` call `fetch` directly. Tests can mock `globalThis.fetch` around each scenario instead of adding function parameters.

## 2026-05-24 Task: provider metadata source
- Provider names should be imported from `@forward-widget/scraper-kit/provider-metadata` instead of re-enumerated in `tmdb-mapping-kit` or app tests/constants.
- `import.meta.resolve` cannot discover provider modules; it only resolves explicit specifiers, so it would still require a hardcoded list and would couple provider metadata to Node/Rslib resolution.
- Keep `provider-metadata` as a lightweight subpath entry. `scraper-kit` root remains bundled separately so Bilibili proto interop stays intact; adding metadata as a second entry requires a separate bundled lib config rather than turning the root build bundleless.

## 2026-05-24 Task: JavaScriptCore-safe provider URL parsing
- `packages/scraper-kit/src/provider-url.ts` must not import `createScraperRegistry`, `./scrapers`, or runtime helpers from `provider-id`, because that pulls Bilibili scraper/protobuf code into tmdb mapping URL parsing.
- Lightweight scraper-kit subpaths such as `@forward-widget/scraper-kit/provider-url`, `provider-metadata`, and `runtime` let tmdb mapping initialize fetch and parse provider URLs without touching the root export surface.
- Bilibili `ep` URL parsing can still use the shared `Fetch` runtime and initialized adapter; keep that dependency at runtime level rather than instantiating `BilibiliScraper` or passing function-level fetch parameters.
- Do not use dynamic `import()` as a proto lazy-load workaround: the widget core runs under JavaScriptCore, which cannot rely on dynamic import support.
- `packages/tmdb-mapping-kit` declaration builds must run after `packages/scraper-kit` build when consuming scraper-kit subpath declarations; parallel package builds can race while `dist/*.d.ts` is being regenerated.
- Avoid unrelated Rstest/Rslib toolchain upgrades while fixing package boundaries. In particular, do not add `@rstest/adapter-rslib` to `apps/danmu-universe` while it remains on `@rslib/core@0.18.x`.
- `rsbuild-plugin-protobufjs` with `wrap: "esm"` emits a direct ESM proto module using `protobufjs/minimal.js`, which fixes the previous bundleless proto interop issue without dynamic import.
- After the proto ESM fix, bundleless root import also required replacing `import { qs } from "url-parse"` with a default `url-parse` import plus destructuring, because `url-parse` is CommonJS and Node ESM cannot read named exports from it.
