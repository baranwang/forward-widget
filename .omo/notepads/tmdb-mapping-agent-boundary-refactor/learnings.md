## 2026-05-17 Session start
- Active plan: `.sisyphus/plans/tmdb-mapping-agent-boundary-refactor.md`.
- Core decisions: derive JSON Schema from Zod, read OpenCode structured output from `response.info.structured`, remove GitHub mutation/publishing from kit code, and move publication to workflow `gh` steps.
- OpenCode structured responses can be consumed directly from `response.info?.structured`; the normal path no longer needs `response.parts` text extraction.
- Task 2 retry fixed the boundary split: package-side `mapping-agent.ts` now stops at artifact generation + summary output and contains no GitHub REST or git/gh publication helpers.
- CLI contract is now file-based (`--issue --issue-body-file --summary-file`) and safe failures return/write summary with status `error` or `ambiguous` and exit code `2`.
- Task 3 workflow preserves exact gate/idempotency checks and moves publication to `gh` steps: issue body fetch, Node-based summary evaluation, guarded failure comment, and success-only branch/commit/push/PR with marker comment.
- Task 4 strengthened non-live boundaries: `parseMappingAgentArgs` now has explicit whitespace/missing-value coverage for `--issue-body-file` and `--summary-file`, and CLI failure paths (invalid issue body and unreadable issue-body-file) assert deterministic summary JSON plus `exitCode=2` without provider/GitHub access.
- Added summary-shape guard for non-success (`ambiguous`) writes and kept schema drift guardrail pinned to `mappingAgentOutputJsonSchema === z.toJSONSchema(modelResponseSchema)`.

## 2026-05-17 Task 5 validation summary
- Ran non-live DoD commands end-to-end: kit test/build/generate and app generate/targeted tests/build all exited 0.
- Deterministic generated map check passed: `git diff --exit-code apps/danmu-universe/src/generated/tmdb-local-map.ts` returned clean after generation.
- Generated map size is `806` bytes (`< 10240`), and `packages/tmdb-mapping-kit/src/generated/*` contains no files.
- YAML parse passed via Ruby for `.github/workflows/tmdb-platform-mapping.yml`, `.github/workflows/local-map.yml`, and `.github/ISSUE_TEMPLATE/tmdb-platform-mapping.yml`.
- Security/static greps passed: exact `/ok` gate present, weak `contains(..., '/ok')` absent, public issue template has no `/ok` and no `ANTHROPIC_API_KEY`, package code contains none of the forbidden GitHub/git publish helpers, structured output path remains `response.info?.structured`, and schema derivation remains `z.toJSONSchema(modelResponseSchema)`.
- LSP diagnostics were attempted but blocked by environment toolchain (`Executable not found in $PATH: biome`) for file and directory scans.
- Evidence files added for this task: `.sisyphus/evidence/task-5-validation.txt` and `.sisyphus/evidence/task-5-security-greps.txt`.

## 2026-05-17 local-map subpath correction
- `@forward-widget/tmdb-mapping-kit/local-map` should be built as a typed source entry (`src/local-map.ts`) and then have `dist/local-map.js` replaced in `onAfterBuild` with JSONL-derived runtime content.
- Keep Rsbuild/Rslib plugin code in `build/` and import that plugin from `rslib.config.ts`; do not make build config depend on `src/generate-local-map.ts`.
- Consumer verification is most reliable from a real dependent workspace package (`apps/danmu-universe`) when root-level package resolution is not linked.
