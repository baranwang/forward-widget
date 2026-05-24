## 2026-05-17 Task: discovery-output
Completed background task IDs `bg_80a9322c`, `bg_7c8b3787`, and `bg_14cb3d6c` could not be retrieved (`Task not found`). This is a tooling issue, not a plan blocker.

## 2026-05-17 Task: scope-creep-cleanup
Removed unintended scope-creep workflow file .github/workflows/opencode.yml during T2 cleanup. Verified file deletion and confirmed task-2 YAML evidence remains workflow_yaml_ok.

## 2026-05-17 Task: final-wave-user-approval-gate
Final reviewers F1-F4 all returned APPROVE after the TV season wording fix, but `.sisyphus/plans/tmdb-mapping-issue-automation.md` lines 273-280 explicitly require presenting results and waiting for the user's exact `okay` before marking F1-F4 complete. Do not check final-wave boxes until that approval is received.

## 2026-05-19 Task: final-wave-reject-f4-scraper-kit-exports
`lsp_diagnostics` could not run because `biome` executable is unavailable in this environment path for the LSP tool.
Required `biome check` command runs but reports pre-existing lint diagnostics in `apps/danmu-universe/src` (e.g., `lint/correctness/useParseIntRadix`).
