# Issues

## 2026-05-20 Task: final verification approval gate
- Final Wave reviewers F1-F4 all returned `APPROVE`, but `.sisyphus/plans/scraper-full-package-migration.md` lines 525-527 explicitly require user `okay` before checking F1-F4. This is the only remaining blocker.

## 2026-05-20 Task: final cleanup verification
- `lsp_diagnostics` still cannot run because the `biome` executable is not available in PATH; `pnpm exec biome check` passed for changed areas and the edited tmdb tsconfig.
- `pnpm deps:check` still fails on workspace dependency range drift; dependency sorting errors for danmu-universe and scraper-kit were fixed in the Task 10 retry. See `.sisyphus/evidence/task-10-final-cleanup.txt` for exact packages/ranges.
- `pnpm build` passes, but root build output still includes the existing nsfw `解析 WidgetMetadata 失败，跳过类型生成` log while Turbo reports all build tasks successful.

## 2026-05-19 Task: session-start
- Existing workspace already contains changes from the rejected parser-only implementation; implementation tasks must reshape rather than assume a clean baseline.
- Prior verification noted unrelated known issues: `pnpm run deps:check` workspace version drift and a full danmu Tencent live test failure. Reconfirm during final verification.

## 2026-05-19 Task: scraper-kit package shape
- `lsp_diagnostics` could not run for the changed package/config files because the `biome` executable is not available in PATH in this environment; package export assertions, build, built-dist import check, and scraper-kit tests passed.

## 2026-05-19 Task: scraper-kit runtime support
- `lsp_diagnostics` still cannot run in this environment because `biome` is missing from PATH; `pnpm exec biome check` was used as the substitute and passed for the changed package files.
- `Fetch` and package-local cache storage still depend on the Forward `Widget.http` and `Widget.storage` runtime globals, matching current scraper behavior; future app shims may be needed if scraper-kit is exercised outside Forward.

## 2026-05-19 Task: scraper-kit runtime support verification fix
- Previous runtime support incorrectly declared/read global `Widget` in scraper-kit; removed `runtime/env.d.ts` and replaced global access with injected adapter interfaces. Later app shim work must pass Forward `Widget.http`/`Widget.storage` from the app side.

## 2026-05-19 Task: runtime dependency correction
- The injectable custom fetch/storage abstraction was also the wrong direction because existing workspace packages already provide those APIs. It was replaced with thin re-exports from `@forward-widget/libs-fetch` and `@forward-widget/libs-storage`.
- Keep watching for accidental reimplementation of existing workspace libs during later scraper moves.

## 2026-05-19 Task: migration guard tests
- `lsp_diagnostics` still cannot run because `biome` is missing from PATH; `pnpm exec biome check packages/scraper-kit/src/provider-id.test.ts` was used as the substitute and passed.

## 2026-05-20 Task: move scraper core
- `lsp_diagnostics` still cannot run because `biome` is missing from PATH; `pnpm exec biome check` was used as the substitute for all changed package/app shim files and passed.
- `pnpm --filter @forward-widget/danmu-universe build` passed but emitted the existing warning `未找到输出文件，跳过类型生成`.

## 2026-05-20 Task: runtime dependency correction
- Earlier custom scraper-kit `Fetch`/`Storage` runtime rewrite was rejected by user verification because existing packages already own that behavior; scraper-kit now uses `@forward-widget/libs-fetch` and `@forward-widget/libs-storage` instead.
- First `pnpm --filter @forward-widget/libs-fetch build` failed because `@forward-widget/libs-storage` declarations were missing; building storage first fixed the fetch build and scraper-kit build.
- `lsp_diagnostics` still cannot run because `biome` is missing from PATH; `pnpm exec biome check` was used as substitute and passed for changed scraper-kit runtime/export files.

## 2026-05-20 Task: move provider implementations
- `lsp_diagnostics` still fails because `biome` is missing from PATH; `pnpm exec biome check` passed on the moved provider files and shims.
- Root importing scraper-kit failed until Bilibili proto dependencies were bundled; keep the bundling/protobuf plugin config unless a later task introduces a more targeted Rspack external configuration.

## 2026-05-20 Task: move provider implementations verification fix
- Atlas found `pnpm --filter @forward-widget/scraper-kit test` was still running moved live provider tests and in-source live tests, causing `Widget is not defined`; removed those from the package test surface.
- `lsp_diagnostics` still fails because `biome` is unavailable on PATH; `pnpm exec biome check` passed for changed files.

## 2026-05-20 Task: move provider implementations browser-build fix
- Fully bundling scraper-kit with `autoExternal: false` pulled dependency code that emitted a top-level Node `crypto` import; bundleless output avoided crypto but broke protobuf/CommonJS interop in app tests. Final fix uses targeted externals plus bundled proto/CJS interop dependencies.
- `lsp_diagnostics` remains unavailable because `biome` is missing from PATH; `pnpm exec biome check` passed for the changed files.

## 2026-05-20 Task: registry factory extraction
- `lsp_diagnostics` still cannot run because `biome` is missing from PATH; `pnpm exec biome check` was used for the package files and passed.
- `pnpm --filter @forward-widget/danmu-universe build` passed with the existing warning `未找到输出文件，跳过类型生成`.

## 2026-05-20 Task: danmu consumes scraper-kit
- `lsp_diagnostics` still cannot run because `biome` is missing from PATH; `pnpm exec biome check` was used as the substitute and passed with existing `parseInt` radix infos in `matchers/douban.ts`.
- `pnpm --filter @forward-widget/danmu-universe build` passed and still emits the existing `未找到输出文件，跳过类型生成` warning.
- `lsp_diagnostics` still fails here because `biome` is missing from PATH; `pnpm exec biome check` is the usable substitute.


## 2026-05-20 Task: regression tests
- `lsp_diagnostics` still cannot run because `biome` is missing from PATH; `pnpm exec biome check packages/scraper-kit/src/index.test.ts apps/danmu-universe/src/scrapers/id-string-compat.spec.ts` was used as the formatting/lint substitute and passed after import ordering was fixed.
