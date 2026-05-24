# Learnings

## 2026-05-18 Task: session-start
- Plan requires `@forward-widget/scraper-kit` as a pure provider ID codec/direct URL parser package.
- Package name is intentionally scraper-kit, but first scope explicitly excludes network scraper runtime.
- Current plan has 8 implementation tasks and 4 final verification gates.

## 2026-05-18 Task: pre-task-search
- Package pattern search confirms `packages/tmdb-mapping-kit` is the closest private Rslib package pattern with `rslib.config.ts`, `rstest.config.ts`, `exports`, and `build/test` scripts.
- Runtime dependencies belong in `dependencies` only when imported by runtime code; Rslib/Rstest/TypeScript stay in `devDependencies`.
- Root `deps:check` is `manypkg check`; new workspace package must satisfy package/dependency graph constraints.
- Querystringify research confirms current BaseScraper imports named `parse`/`stringify`; preserving object property insertion order is important for byte-for-byte ID string compatibility.

## 2026-05-19 Task: scaffold-verification
- `packages/scraper-kit` needs its own local `tsconfig.json` for Rslib to resolve declarations during build.
- `rstest` exits non-zero when no tests are present, so a minimal smoke test is required even for an empty scaffold.
- Verified the new package has no leaked runtime imports from `libs-fetch`, `libs-storage`, protobuf, or logger packages.

## 2026-05-19 Task: provider-id-provider-url-red-tests
- Added contract-first test files `provider-id.test.ts` and `provider-url.test.ts` to define public API expectations before implementation.
- Kept compile-only stubs in `scraper-kit/src/index.ts` intentionally incorrect so failures stay assertion-driven for TDD red phase.
- URL parser contract explicitly treats malformed/unsupported URLs as `null` and bans inferred Renren formats without direct evidence.

## 2026-05-19 Task: provider-url-contract-fixup
- `parseProviderUrl(url)` success contracts must include a stable `url` field in the returned payload alongside `provider`, `id`, and `idString`.
- Public API surface also requires `parseProviderUrlFor(provider, url)`; red tests now cover provider-match success, provider mismatch, and malformed URL null behavior.
- Compile-only stub exports can remain `null` for red phase as long as failures are assertion-based rather than import/type/config errors.

## 2026-05-19 Task: provider-id-codec-implementation
- Implemented `packages/scraper-kit/src/provider-id.ts` as the dedicated provider ID codec module and re-exported its public API from `src/index.ts`.
- Preserved querystringify compatibility by parsing with `parse` and generating with `stringify` using explicit provider-specific field insertion order.
- Required-field validation now throws provider-specific errors and Renren ID parsing coerces numeric fields to `number` to match legacy `z.coerce.number()` behavior.

## 2026-05-19 Task: provider-url-implementation
- Implemented dedicated `packages/scraper-kit/src/provider-url.ts` with direct-only parsers for Tencent, Youku, IQIYI, Bilibili (`ss` only), and MGTV (`/h` and `/b`) and explicit `null` for unsupported cases including Renren.
- `parseProviderUrl` now returns `{ provider, id, idString, url }` and computes `idString` via `generateProviderIdString` to preserve codec ordering/format compatibility.
- `parseProviderUrlFor(provider, url)` now returns `{ id, idString, url }` only when parsed provider matches and returns `null` for mismatches/malformed URLs without throwing.

## 2026-05-19 Task: scraper-kit-finalization
- `packages/scraper-kit/src/index.ts` already exposes only the intended stable API surface from `provider-id.ts` and `provider-url.ts`.
- `pnpm --filter @forward-widget/scraper-kit build` regenerated `dist/index.d.ts` with the expected exports: `providerNames`, `ProviderName`, `isProviderName`, provider ID types, `ProviderId`, `parseProviderIdString`, `generateProviderIdString`, `ParsedProviderUrl`, `parseProviderUrl`, and `parseProviderUrlFor`.
- `pnpm --filter @forward-widget/scraper-kit test` passed with 20/20 tests.

## 2026-05-19 Task: scraper-kit-biome-fix
- A package-local `biome.json` is treated as a nested root in this repo, so the stable package-scoped solution is a local `.gitignore` plus root `vcs.useIgnoreFile: true`.
- `pnpm exec biome check "packages/scraper-kit"` now passes after the build, with `dist/`, `node_modules/`, and `tsconfig.tsbuildinfo` ignored from the package directory scan.

## 2026-05-19 Task: danmu-universe-provider-id-migration
- `BaseScraper.generateIdString` and `BaseScraper.parseIdString` now delegate to `@forward-widget/scraper-kit` for known providers via `isProviderName`, while keeping querystringify fallback behavior for unsupported/non-provider names.
- `QihooMatcher` and `DoubanMatcher` direct URL parsing for supported providers now use `parseProviderUrl`, but provider-specific network flows remain unchanged (`videoIdToEntityId` and Bilibili HTML season-id extraction are preserved).
- Added deterministic compatibility coverage in `src/scrapers/id-string-compat.spec.ts` for required provider ID-string output/parse pairs.

## 2026-05-19 Task: danmu-universe-fallback-restoration
- Matcher migration must be parseProviderUrl-first with legacy extraction fallback kept for non-matching/unsupported URLs to avoid behavior regression in partner URL variants.
- For `360kan`, preserving legacy fallback required exact old patterns: qq `/cover/...` regex, youku `url-parse` query extraction (`showid`/`vid`), and imgo `/b/{dramaId}/` regex.
- For `douban`, preserving old per-vendor fallback required retaining `parseUrl(vendor.uri, true)` extraction and bilibili pathname tail numeric parsing when scraper-kit direct parse does not match.

## 2026-05-19 Task: tmdb-mapping-agent-parser-migration
- `tmdb-mapping-kit` mapping-agent now resolves deterministic providers through `parseProviderUrl` before any model/OpenCode fallback.
- Bilibili `ep` links still require mapping-agent-local API lookup (`/pgc/view/web/season?ep_id=...`) because scraper-kit intentionally returns `null` for episode URLs.
- MGTV deterministic mapping now persists BaseScraper-compatible ID strings (`dramaId=...`) by trusting scraper-kit `idString` output rather than local regex raw IDs.

## 2026-05-19 Task: full-repo-verification
- Full task-8 verification passes for scraper-kit tests/build, tmdb-mapping-kit targeted tests/build, danmu-universe build, and deterministic id-string compatibility tests.
- `tmdb-mapping-kit` build initially failed on TS7016 resolving `@forward-widget/scraper-kit`; a targeted local declaration shim (`packages/tmdb-mapping-kit/src/types/scraper-kit.d.ts`) restored declaration-build compatibility without runtime coupling.
- Import-boundary audit confirmed no forbidden references from scraper-kit/tmdb-mapping-kit into `apps/danmu-universe`, runtime fetch/storage libs, protobuf, or browser/network request APIs.

## 2026-05-19 Task: full-repo-verification-scope-correction
- Source-level declaration artifacts (`packages/scraper-kit/src/*.d.ts`) and the tmdb local module shim were out-of-scope and removed.
- With verification rerun in correct order (build scraper-kit before tmdb consumer checks), tmdb-mapping-kit build passes without any local `declare module` fallback.
- Contract boundary remains cleanest when scraper-kit types come only from TypeScript source + generated `dist` declarations.

## 2026-05-18 Task: final-wave-rejection-fix
- F4 rejected because `packages/tmdb-mapping-kit` could not build when `packages/scraper-kit/dist` was absent.
- Reproduced by removing scraper-kit `dist`/tsbuildinfo before running `pnpm --filter @forward-widget/tmdb-mapping-kit build`.
- Fixed by pointing private workspace package `@forward-widget/scraper-kit` exports/types at TypeScript source (`./src/*.ts`) instead of generated `dist`.
- Verified `tmdb-mapping-kit` build passes after removing scraper-kit generated artifacts; no source `.d.ts` shims were reintroduced.

## 2026-05-19 Task: final-wave-f4-rerun
- Re-ran F4 after source-path export fix. Removing packages/scraper-kit/dist and packages/scraper-kit/tsconfig.tsbuildinfo no longer breaks `pnpm --filter @forward-widget/tmdb-mapping-kit build`.
- Source-path exports in `packages/scraper-kit/package.json` are acceptable for this private workspace package because current Rslib/Rstest consumers can resolve TypeScript source directly and build still emits dist for package output.
- Scope audit found scraper-kit remains pure provider ID codec/direct URL parser only: runtime imports are limited to `querystringify` plus local modules, with no fetch/storage/logger/protobuf/app-runtime imports.
