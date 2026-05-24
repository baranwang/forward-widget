# Issues

## 2026-05-18 Task: session-start
- Need verify `querystringify` dependency placement for the new package and workspace dependency checks.
- Need avoid app runtime dependency leaks into scraper-kit.
- Need preserve Bilibili `ep` API lookup in mapping-agent while keeping scraper-kit pure.

## 2026-05-19 Task: scaffold-verification
- `pnpm run deps:check` still fails because of pre-existing version drift in `apps/danmu-universe` and `packages/tmdb-mapping-kit`; the new package is no longer part of the failure set.

## 2026-05-19 Task: verification-rerun
- `pnpm run deps:check` continues to fail for the same pre-existing workspace drift in `apps/danmu-universe`, `packages/nsfw`, and `packages/tmdb-mapping-kit`.
- `@forward-widget/scraper-kit` is not part of the failure set.

## 2026-05-19 Task: provider-url-implementation
- `lsp_diagnostics` could not execute in this environment because `biome` is missing from PATH for the LSP bridge; used `pnpm exec biome check` on changed files as verification substitute.

## 2026-05-19 Task: scraper-kit-finalization
- `pnpm run deps:check` still fails for pre-existing workspace drift in `@forward-widget/danmu-universe`, `@forward-widget/nsfw`, and `@forward-widget/tmdb-mapping-kit`.
- `@forward-widget/scraper-kit` is not part of the failure set.

## 2026-05-19 Task: scraper-kit-biome-fix
- `pnpm exec biome check "packages/scraper-kit"` initially failed because Biome treated a package-local `biome.json` as a nested root.
- The fix required enabling `vcs.useIgnoreFile` at the repo root and using `packages/scraper-kit/.gitignore` for package-scoped build artifacts.

## 2026-05-19 Task: danmu-universe-provider-id-migration
- `lsp_diagnostics` could not run in this environment because `biome` is missing from PATH for the LSP bridge; verification used `pnpm exec biome check` on changed files.
- `pnpm --filter @forward-widget/danmu-universe test` still has a pre-existing Tencent live test failure (`url-parse` `qs.stringify` undefined in `src/scrapers/tencent/tencent.ts`) unrelated to this migration; deterministic parser compatibility tests pass.

## 2026-05-19 Task: danmu-universe-fallback-restoration
- Required verification includes Biome import ordering checks; these were fixed for matcher files and `base.ts`, but existing non-task lint findings remain (`douban.ts` parseInt radix and `base.ts` generic any).

## 2026-05-19 Task: tmdb-mapping-agent-parser-migration
- `lsp_diagnostics` remains unavailable in this environment because `biome` is not on PATH for the LSP bridge; validation used `pnpm exec biome check` plus targeted rstest/build commands.

## 2026-05-19 Task: full-repo-verification
- `pnpm run deps:check` still fails for the known unrelated workspace version drift in `@forward-widget/danmu-universe`, `@forward-widget/nsfw`, and `@forward-widget/tmdb-mapping-kit`; `@forward-widget/scraper-kit` is not in the failure set.
- Required Biome command still reports pre-existing danmu-universe findings (e.g. parseInt radix lint issues in `apps/danmu-universe/src/matchers/douban.ts` and `apps/danmu-universe/src/scrapers/bilibili/bilibili.ts`) outside scraper-kit extraction scope.

## 2026-05-19 Task: full-repo-verification-scope-correction
- `pnpm run deps:check` remains unchanged and failing only in the known unrelated set (`@forward-widget/danmu-universe`, `@forward-widget/nsfw`, `@forward-widget/tmdb-mapping-kit`).
- Scoped Biome verification still reports pre-existing `apps/danmu-universe/src` findings unrelated to scraper-kit extraction work.

## 2026-05-18 Task: final-wave-f4-rejection
- F4 found an in-scope package-boundary issue: `tmdb-mapping-kit` could not build against `@forward-widget/scraper-kit` if scraper-kit `dist` was absent.
- Fixed by changing scraper-kit package exports/types to source paths and re-verifying clean no-dist consumer build.
- Final Biome path check still reports existing danmu-universe lint warnings/infos (parseInt radix, noExplicitAny), not scraper-kit/tmdb boundary failures.
