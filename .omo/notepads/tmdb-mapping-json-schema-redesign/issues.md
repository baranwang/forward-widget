## Task 1 verification - 2026-05-27
- Full `pnpm --filter @forward-widget/tmdb-mapping-kit test` currently fails in `src/mapping-agent.test.ts` because mapping-agent still expects old JSONL/candidate `url`/`sourceUrl`/`verifiedAt` shape. This is expected pending Task 5, while Task 1 focused schema/index tests pass.

## Task 2 verification - 2026-05-27
- Blocked: legacy TMDB `282136` row had row-level `season: null`, but new TV provider schema requires numeric `providers[].season`. Subagent chose `season: 1`; Oracle rejected this as inventing a season-specific mapping without user/data-owner authority.

## Task 3 verification - 2026-05-27
- `pnpm --filter @forward-widget/tmdb-mapping-kit build` still fails during declaration generation in `src/mapping-agent.ts` and `src/mapping-agent.test.ts`, which are Task 5 migration areas. The Task 3 Rslib plugin did emit `dist/local-map.js` before the unrelated declaration failure.
- `lsp_diagnostics` could not complete for changed files because the workspace Biome LSP server exited with code -2; `pnpm exec biome check` passed on the changed files instead.

## Task 7 final validation - 2026-05-27
- Still blocked: `packages/tmdb-mapping-kit/data/tv/282136.json` contains `providers[0].season: 1`, but the legacy source had `season:null`. This remains an external data-owner decision; Task 7 did not change real mapping data or accept the guessed season as authoritative.
