## 2026-05-17 Task: session-start
Selected `tmdb-mapping-kit-migration` based on immediate context and Momus approval. Work happens in the current project directory. Loaded Rslib/Rstest best-practice skills for package/test work.

## 2026-05-17 Task 1: unsafe demo removal and schema boundaries
- Keep `packages/tmdb-mapping-kit/src/index.ts` export-only: re-export schemas and inferred types, with no import-time execution or runtime provider setup.
- Split schema concerns in `src/schema.ts`: canonical persisted mapping rows should not require provider URLs; expose a separate candidate schema when model output requires provider URLs.
- Canonical provider enum should be strict (`tencent`, `youku`, `iqiyi`, `bilibili`, `mgtv`, `renren`), and canonical persisted rows should keep `verifiedAt` explicit (no default current timestamp).

## 2026-05-17 Task 1 QA follow-up: source-local schema tests
- Added source-local tests at `packages/tmdb-mapping-kit/src/schema.test.ts` to satisfy kit-level coverage requirements for canonical and candidate schemas.
- Canonical TV `season` validation was tightened to non-negative integers (`.int().nonnegative().nullable().optional()`) to match expected invalid-negative-season behavior.
- Scoped filter commands with `@forward-widget/tmdb-mapping-kit` currently match no package; functional verification succeeded with actual package name filter `tmdb-mapping-kit`.

## 2026-05-17 Task 1 closure: scoped package rename
- Renamed `packages/tmdb-mapping-kit/package.json` package name to `@forward-widget/tmdb-mapping-kit` so mandated pnpm filter commands resolve correctly.
- Re-ran scoped verification successfully: `pnpm --filter @forward-widget/tmdb-mapping-kit test` and `build` both pass.

## 2026-05-17 Task 2: JSONL + generator migration into kit
- Migrated canonical TMDB JSONL rows unchanged to `packages/tmdb-mapping-kit/data/tmdb-platform-map.jsonl`; kit now owns the canonical data source.
- Added reusable generator module `packages/tmdb-mapping-kit/src/generate-local-map.ts` with configurable `sourcePath`/`outputPath`, preserving prior validation semantics (provider enum, non-negative integer checks for ids/season/episode, movie/tv keying, `series` key for null season, and output-size guard `< 10240` bytes).
- Added kit CLI entry `packages/tmdb-mapping-kit/src/cli/generate-local-map.ts` and package script `generate:local-map`, and verified the mandated command succeeds from repo root.
- Reduced `apps/danmu-universe/scripts/generate-local-map.ts` to a thin wrapper delegating to kit logic with only app output-path binding, removing duplicated long-term validation/generation code.

## 2026-05-17 Task 2 QA closure
- Deleted `apps/danmu-universe/data/tmdb-platform-map.jsonl` so canonical JSONL now exists only under kit `data/`.
- Re-exported generator public surface from kit root: value exports (`generateLocalMap`, `runGenerateLocalMapCli`) plus public types (`GenerateLocalMapOptions`, `GenerateLocalMapResult`).
- Re-verified mandated generator command and kit test/build; generated app map shape/content remains unchanged.

## 2026-05-17 Task 3: danmu-universe consumer/test migration to kit boundary
- Updated `apps/danmu-universe/package.json` to depend on `@forward-widget/tmdb-mapping-kit` via `workspace:^` and switched app `generate:local-map` to call the kit package script through `pnpm --filter` with explicit app output path.
- Replaced app script relative source import (`../../../packages/.../src`) with package import (`@forward-widget/tmdb-mapping-kit`) to keep consumer integration on workspace package boundaries.
- Updated app local-map JSONL validation test to read canonical kit data path `../../packages/tmdb-mapping-kit/data/tmdb-platform-map.jsonl`; no app test now references removed app-local canonical data.
- Verified from `apps/danmu-universe`: `pnpm generate:local-map` passes and targeted tests (`src/types/local-map.test.ts`, `src/matchers/local.test.ts`, `src/index.test.ts`) all pass.

## 2026-05-17 Task 4: workflow and issue template alignment
- Updated `.github/workflows/local-map.yml` PR path filters to watch kit-owned canonical data/generator/package files and keep app consumer paths, removing obsolete app-local data/script paths.
- Switched workflow generation to the mandated root command: `pnpm --filter @forward-widget/tmdb-mapping-kit generate:local-map -- --output ../../apps/danmu-universe/src/generated/tmdb-local-map.ts`.
- Kept deterministic diff and output-size checks for `apps/danmu-universe/src/generated/tmdb-local-map.ts`, and confirmed issue template wording remains neutral without exposing approval commands or secret variable names.


## 2026-05-17 Task 4: local-map workflow + public issue template copy
- Updated `.github/workflows/local-map.yml` PR path filters to watch kit-owned mapping inputs and generator sources (`packages/tmdb-mapping-kit/data/tmdb-platform-map.jsonl`, kit `package.json`, `src/generate-local-map.ts`, `src/cli/generate-local-map.ts`) while retaining generated output, matcher/types, app package, and workflow self-watch.
- Switched workflow generation step to the mandated repo-root command: `pnpm --filter @forward-widget/tmdb-mapping-kit generate:local-map -- --output ../../apps/danmu-universe/src/generated/tmdb-local-map.ts`.
- Kept generated-output diff check, output-size guard, and targeted app local-map tests unchanged; sanitized public issue-template wording to maintainer-review language with no explicit trigger token or secret name.

## 2026-05-17 Task 5: repo-owned mapping agent
- Replaced the OpenCode GitHub Action with a kit-owned `tmdb:mapping-agent` command invoked by `.github/workflows/tmdb-platform-mapping.yml` after the existing exact `/ok`, label, association, marker, branch, and PR gates.
- The mapping agent keeps provider configuration lazy and env-driven (`OPENCODE_API_KEY`, `OPENCODE_BASE_URL`, `OPENCODE_MODEL`, optional `OPENCODE_PROVIDER`) and validates structured OpenCode JSON-schema output again with zod before writing canonical JSONL.
- Confident mappings append only `packages/tmdb-mapping-kit/data/tmdb-platform-map.jsonl`, regenerate `apps/danmu-universe/src/generated/tmdb-local-map.ts`, and create a deterministic changeset; ambiguous or invalid extraction fails before artifact writes/PR creation.

## 2026-05-17 Task 5: repo-owned mapping agent
- Replaced the workflow OpenCode GitHub Action with a repo-owned `pnpm --filter @forward-widget/tmdb-mapping-kit tmdb:mapping-agent -- --issue <number>` command while preserving `/ok`, `tmdb-mapping`, maintainer association, marker comment, branch, and PR idempotency gates.
- Mapping-agent helpers live in `packages/tmdb-mapping-kit/src/mapping-agent.ts`; tests cover issue-field parsing, safe ambiguity/mismatch failures, duplicate JSONL rejection, changeset content, and provider/model env parsing without requiring provider env at import/test/build time.
- The agent writes only kit-owned `packages/tmdb-mapping-kit/data/tmdb-platform-map.jsonl`, regenerates the app local map via the kit generator, creates a changeset for `@forward-widget/tmdb-mapping-kit` and `@forward-widget/danmu-universe`, then publishes the branch/PR with `tmdb-mapping-agent:pr-created`.

## 2026-05-17 Task 6: end-to-end verification
- `pnpm --filter @forward-widget/tmdb-mapping-kit test` passed (22 tests, 3 files).
- `pnpm --filter @forward-widget/tmdb-mapping-kit build` passed (`dist/index.js` emitted; d.ts generated).
- `pnpm --filter @forward-widget/tmdb-mapping-kit generate:local-map -- --output ../../apps/danmu-universe/src/generated/tmdb-local-map.ts` passed and generated `apps/danmu-universe/src/generated/tmdb-local-map.ts` (806 bytes).
- `pnpm --filter @forward-widget/danmu-universe generate:local-map` passed.
- Targeted app tests passed: `pnpm test src/types/local-map.test.ts src/matchers/local.test.ts src/index.test.ts` (13 tests, 3 files).
- `pnpm --filter @forward-widget/danmu-universe build` passed.
- YAML parse checks passed for `.github/workflows/local-map.yml`, `.github/workflows/tmdb-platform-mapping.yml`, and `.github/ISSUE_TEMPLATE/tmdb-platform-mapping.yml` via Ruby `YAML.load_file`.
- Workflow/public-template security checks passed: exact `commentBody === '/ok'` present, no `contains(github.event.comment.body, '/ok')`, no `anomalyco/opencode/github@latest`, and no `/ok` or `ANTHROPIC_API_KEY` in public issue template.
- Secret-like hardcoded-value grep in kit source passed for literal patterns (`apiKey: "..."`, `sk-...`); only env-based `OPENCODE_API_KEY` usage remains in `mapping-agent.ts`.
- LSP diagnostics are currently blocked in this environment: `Executable not found in $PATH: biome`.
- Added `.changeset/tiny-forks-join.md` with patch bumps for `@forward-widget/tmdb-mapping-kit` and `@forward-widget/danmu-universe`.

## 2026-05-17 Task 6 rerun: verification confirmation
- Re-ran all mandated verification commands successfully:
  - `pnpm --filter @forward-widget/tmdb-mapping-kit test`
  - `pnpm --filter @forward-widget/tmdb-mapping-kit build`
  - `pnpm --filter @forward-widget/tmdb-mapping-kit generate:local-map -- --output ../../apps/danmu-universe/src/generated/tmdb-local-map.ts`
  - `pnpm --filter @forward-widget/danmu-universe generate:local-map`
  - `pnpm --filter @forward-widget/danmu-universe test -- src/types/local-map.test.ts src/matchers/local.test.ts src/index.test.ts`
  - `pnpm --filter @forward-widget/danmu-universe build`
- Re-validated workflow/template security requirements: exact `commentBody === '/ok'` is present, `contains(github.event.comment.body, '/ok')` is absent, `anomalyco/opencode/github@latest` is absent, and public issue template contains neither `/ok` nor `ANTHROPIC_API_KEY`.
- Re-validated YAML parsing via Ruby `YAML.safe_load` for `.github/workflows/local-map.yml`, `.github/workflows/tmdb-platform-mapping.yml`, and `.github/ISSUE_TEMPLATE/tmdb-platform-mapping.yml`.
- Re-validated secret-like pattern scan under `packages/tmdb-mapping-kit`: no `sk-` and no `ANTHROPIC_API_KEY`; `apiKey:` usage remains env-driven in `src/mapping-agent.ts` (`OPENCODE_API_KEY`) without hardcoded secret literals.
- LSP diagnostics remains blocked in this environment due to missing `biome` executable.
- Changeset requirement is already satisfied by existing `.changeset/tiny-forks-join.md` (patch bumps for both affected packages); no additional changeset was added.

## 2026-05-17 Task 3: stray kit-generated artifact cleanup
- Confirmed `packages/tmdb-mapping-kit/src/generated/tmdb-local-map.ts` is absent; the only generated map that should remain is `apps/danmu-universe/src/generated/tmdb-local-map.ts`.
- Verified `packages/tmdb-mapping-kit/src/generated/*` is empty, so the kit-local generated directory can stay removed or empty without affecting the app copy.

## 2026-05-17 Cleanup: stray package-local generated map removed
- Deleted the accidental `packages/tmdb-mapping-kit/src/generated/tmdb-local-map.ts` artifact and removed the now-empty `src/generated/` directory.
- Verified `pnpm --filter @forward-widget/tmdb-mapping-kit build` still passes, and the explicit generator command only writes `apps/danmu-universe/src/generated/tmdb-local-map.ts`.
