
## Task 0 cleanup - 2026-05-27
- Classified rejected prior implementation paths by targeted diff: danmu-universe local lookup/index/type/test changes, tmdb-mapping-kit schema/generator/plugin/local-map/mapping-agent/test changes, the accidental JSONL season edit, and untracked episode-number helper files all belonged to the rejected long-field design.
- Reverted only those confirmed rejected paths; preserved unrelated root/tooling changes in .vscode/settings.json, biome.json, package.json, and pnpm-lock.yaml.
- .github/workflows/tmdb-platform-mapping.yml had no dirty diff during Task 0 and was left unchanged.
- Verification evidence captured in .omo/evidence/task-0-status.txt and .omo/evidence/task-0-cleanup.diff.txt; targeted diff contains no tmdbEpisodeStart, tmdbEpisodeEnd, or platformEpisodeStart matches.

## Task 1 schema - 2026-05-27
- Current schema exports were legacy JSONL-shaped and consumed by mapping-agent plus public index tests; Task 1 preserved existing exported names as compatibility aliases while backing them with the new strict one-TMDB-one-JSON schemas.
- Provider enum source remains @forward-widget/scraper-kit/provider-metadata providerNames; TV provider output defaults epOffset to 0, movie providers are strict and reject TV-only season/epRange/epOffset fields.
- Focused schema tests now cover the user TV example without sourceUrl, defaulted epOffset, unknown-field rejection, movie TV-field rejection, rejected long field names, invalid epRange order, and required TV provider season.

## Task 2 migration - 2026-05-27
- Migrated the two legacy TV JSONL rows into `data/tv/282136.json` and `data/tv/97199.json`, preserving only `type`, `tmdbId`, `title`, and `providers` at the top level.
- The legacy `282136` row had `season: null`; I set the provider `season` to `1` so the file satisfies the strict Task 1 schema without reading the provider id string.

## Task 5 mapping-agent - 2026-05-27
- Mapping-agent candidate schema now accepts provider `url` only at candidate time; canonical JSON is parsed through the strict mapping schema and strips `url`, `sourceUrl`, and `verifiedAt` before writing.
- Mapping-agent writes `packages/tmdb-mapping-kit/data/{type}/{tmdbId}.json`, merges provider entries deterministically, no-ops exact duplicates, rejects overlapping ranges only for the same provider/season/idString, and allows overlapping different idString or no-range entries.
- `.github/workflows/tmdb-platform-mapping.yml` had one JSONL-specific staging line; it now stages `packages/tmdb-mapping-kit/data` so per-TMDB JSON files are included.

## Task 3 generator/plugin - 2026-05-27
- `src/generate-local-map.ts` now owns JSON directory reading, strict JSON parsing, Zod schema validation, filename/body consistency checks, duplicate TMDB rejection, deterministic provider sorting, flat local map creation, and runtime module rendering.
- `scripts/local-map-plugin.ts` no longer duplicates parser/sorter logic or references JSONL; it adds each discovered JSON source file as a build dependency and calls the shared generator for `dist/local-map.js`.
- `src/local-map.ts` now reuses schema-derived provider/map types exported by the generator; generated TV runtime entries are flat arrays, not season-keyed objects.

## Task 3 focused generator tests - 2026-05-27
- Added `src/generate-local-map.test.ts` so Atlas can run the dedicated focused command `pnpm --filter @forward-widget/tmdb-mapping-kit test src/generate-local-map.test.ts`; it passes with 9 generator/parser/runtime-render tests.
- The focused tests use in-memory `LocalMapSourceFile` fixtures and cover strict JSON parsing, Zod defaulted `epOffset`, flat `tv[id] -> providers[]` output from two TV JSON fixtures, runtime module rendering, filename/body mismatch, invalid JSON, unknown-field schema rejection, wrong parent directory, duplicate source file, and duplicate TMDB mapping failures.
- Verification after adding the dedicated test file: full `pnpm --filter @forward-widget/tmdb-mapping-kit test` passed with 53 tests, required Biome check passed, and `pnpm --filter @forward-widget/tmdb-mapping-kit build` passed while emitting `dist/local-map.js`.

## Task 4 danmu-universe runtime - 2026-05-27
- `apps/danmu-universe/src/matchers/local.ts` now reads generated flat maps directly: movies use `movie[tmdbId] -> providers[]`; TV uses `tv[tmdbId] -> providers[]` filtered by provider-level `season`, optional inclusive `epRange`, and `episode + epOffset` translation.
- TV lookup now requires an explicit TMDB season, accepts optional `episode`, returns no-episode season matches without `episodeNumber`, and drops translated episodes only when the computed provider episode is non-integer or `< 0`; computed episode `0` is preserved.
- `searchDanmu` now passes the requested TMDB episode into local lookup and bypasses original-TMDB-episode filtering only for local mapped scraper calls, while Douban/search paths still apply the generic original episode filter.
- App-side local-map tests no longer model legacy JSONL `LocalMapEntry` fields (`sourceUrl`, `verifiedAt`, `year`) or read `tmdb-platform-map.jsonl`; type tests now cover the generated flat runtime shape and optional lookup `episode`.
- Verification: `pnpm --filter @forward-widget/danmu-universe test src/matchers/local.test.ts` passed with 14 tests; `pnpm --filter @forward-widget/danmu-universe test src/types/local-map.test.ts` passed with 3 tests; required `pnpm exec biome check apps/danmu-universe/src/types/local-map.ts apps/danmu-universe/src/matchers/local.ts apps/danmu-universe/src/matchers/local.test.ts apps/danmu-universe/src/types/local-map.test.ts apps/danmu-universe/src/index.ts` passed; `pnpm --filter @forward-widget/danmu-universe build` passed with the existing "未找到输出文件，跳过类型生成" warning.
- `lsp_diagnostics` was attempted for all five touched app files, but the workspace Biome LSP exited with code -2, matching the known local diagnostic blocker; Biome CLI was used as the reliable fallback.

## Task 6 regression tests - 2026-05-27
- Added schema regression coverage for zero-valued TV seasons/episodes and negative `epOffset` acceptance in `packages/tmdb-mapping-kit/src/schema.test.ts`.
- Added a public-export regression check in `packages/tmdb-mapping-kit/tests/index.test.ts` to confirm `canonicalMappingSchema` still defaults omitted TV `epOffset` to `0` on the exported API.
- Added runtime regression coverage in `apps/danmu-universe/src/matchers/local.test.ts` for season `0` plus episode `0` lookups using safe fixtures, while preserving the existing inclusive `epRange`, local no-refilter, and generic non-local filtering coverage.
- Verification: `pnpm --filter @forward-widget/tmdb-mapping-kit test src/schema.test.ts tests/index.test.ts src/mapping-agent.test.ts src/generate-local-map.test.ts` passed with 55 tests; `pnpm --filter @forward-widget/danmu-universe test src/matchers/local.test.ts src/types/local-map.test.ts` passed with 18 tests; `pnpm exec biome check packages/tmdb-mapping-kit/src/schema.test.ts packages/tmdb-mapping-kit/tests/index.test.ts packages/tmdb-mapping-kit/src/mapping-agent.test.ts packages/tmdb-mapping-kit/src/generate-local-map.test.ts apps/danmu-universe/src/matchers/local.test.ts apps/danmu-universe/src/types/local-map.test.ts` passed.

## Task 7 final validation - 2026-05-27
- Full final validation passes for implementable code after targeted hygiene fixes: `pnpm --filter @forward-widget/tmdb-mapping-kit test` (55 tests), `pnpm --filter @forward-widget/danmu-universe test` (31 tests), both package builds, and `pnpm exec biome check packages/tmdb-mapping-kit apps/danmu-universe/src` all passed.
- Danmu full test initially failed because `src/index.ts` was included as an in-source Rstest suite with no tests; adding a small entrypoint registration test made the suite valid without using live TMDB/network.
- Biome initially caught app-side hygiene issues unrelated to mapping semantics: missing `parseInt` radix in `matchers/douban.ts`, `any[]` logger args, and generated env declaration formatting. These were fixed directly and targeted checks passed.
- Forbidden artifact searches are clean after preserving the rejected-long-field schema regression via constructed field names: no literal `tmdbEpisodeStart`, `tmdbEpisodeEnd`, `platformEpisodeStart`, no JSONL runtime reference, and no `sourceUrl`, `verifiedAt`, or forbidden `year` fields in data.
- Running danmu tests concurrently with a tmdb-mapping-kit build can race on `packages/tmdb-mapping-kit/dist/local-map.js`; rerun after the build completed passed. Final validation should avoid overlapping those two commands.
