## 2026-05-17 Task: session-start
Background discovery tasks were launched for issue patterns, workflow patterns, and opencode action research, but `background_output` returned `Task not found` for all three handles after completion notifications. Continue with direct targeted reads of known files and delegate implementation tasks with explicit verification.

## 2026-05-17 Task: issue-form-created
已新增 `.github/ISSUE_TEMPLATE/tmdb-platform-mapping.yml`，字段使用稳定 id，包含 movie/tv、TMDB 链接、TV 季号指引、多平台 URL（每行一个）与可选备注；并完成 YAML 解析与旧模板存在性校验。

## 2026-05-17 Task: placeholder-cleanup
已将平台链接示例替换为真实风格 URL（不含 xxx/xxxx/xxxxx）；并通过 anti-pattern grep 与 YAML 解析校验。

## 2026-05-17 Task: workflow-ok-shell
新增 \.github/workflows/tmdb-platform-mapping.yml：仅在 issue_comment.created 触发，且通过精确 /ok、tmdb-mapping 标签、OWNER/MEMBER/COLLABORATOR 权限三重门禁后才继续；在未来 agent 步骤前加入幂等预检查（marker 注释 tmdb-mapping-agent:pr-created 或分支/PR tmdb-mapping/issue-{issueNumber} 已存在即拦截）。工作流权限与 Node 版本约定对齐 release.yml（node-version-file: .node-version，含 contents/pull-requests/issues/id-token write）。

## 2026-05-17 Task: workflow-ok-shell-note
上条记录中的分支模板应为字面量 tmdb-mapping/issue-${issueNumber}。

## 2026-05-17 Task: workflow-yaml-evidence-fix
修复  为空的问题：重新执行 Ruby YAML 校验并写入 ，已确认文件非空。

## 2026-05-17 Task: workflow-yaml-evidence-fix
修复 .sisyphus/evidence/task-2-yaml.txt 为空的问题：重新执行 Ruby YAML 校验并写入 workflow_yaml_ok，已确认文件非空。

## 2026-05-17 Task: prompt-guardrails-contract
已将 `.github/workflows/tmdb-platform-mapping.yml` 末尾占位步骤替换为 `Run OpenCode mapping agent`，保留既有 gates/idempotency 条件不变，并接入 `anomalyco/opencode/github@latest`（含 `ANTHROPIC_API_KEY`、`GITHUB_TOKEN`、`model`、`use_github_token: true`、`prompt: |`）。Prompt 明确了 untrusted 输入边界、仅解析指定字段、TMDB 类型校验、`tmdb-platform-map.jsonl` 更新条件、`pnpm generate:local-map`、`.changeset` patch、测试与构建、成功回贴 marker，以及 ambiguous/incomplete 时失败评论并 do not create a PR。已生成 `.sisyphus/evidence/task-3-prompt-guardrails.txt` 与 `.sisyphus/evidence/task-3-safe-failure.txt`，并通过 Ruby YAML 解析校验。

## 2026-05-17 Task: prompt-guardrails-hardening
按 QA 反馈收敛了 T3 prompt：新增“仅在 confident 时从 platform_urls 推导 supported provider `idString`，否则按 ambiguous 失败处理并停止”，并将测试命令收敛为精确目标命令 `pnpm test src/types/local-map.test.ts src/matchers/local.test.ts src/index.test.ts`（目录 `apps/danmu-universe`）。随后刷新 task-3 两个 evidence 文件并再次通过 `workflow_yaml_ok` 校验。

## 2026-05-17 Task: approval-idempotency-hardening-check
复核 `.github/workflows/tmdb-platform-mapping.yml` 后确认无需改码：`/ok` 为精确匹配、`tmdb-mapping` 标签与 `OWNER/MEMBER/COLLABORATOR` 权限共同构成 `can_proceed`；OpenCode 步骤同时受 `can_proceed == 'true'` 与 `already_processed != 'true'` 双条件约束。幂等性由 marker 注释 `tmdb-mapping-agent:pr-created` + 分支 `tmdb-mapping/issue-${issueNumber}` + 既有 PR 检查三重保障。Prompt 已包含成功回贴 PR 链接与 marker，以及 `Never auto-close the issue` 约束。

`local-map.yml` 路径过滤本次不改：该工作流职责是本地映射生成与测试，纳入 issue 自动化工作流/模板会引入无关触发；该判断已记录在 task-4 evidence。

## 2026-05-17 Task: task-5-e2e-validation
已在 `.github/ISSUE_TEMPLATE/tmdb-platform-mapping.yml` 增加最小用户说明：提交 TMDB URL + 平台 URL（每行一个）、TV 季号填写场景、仅精确 `/ok` 才触发自动化、以及仓库需配置 `ANTHROPIC_API_KEY` secret 才能进行 GitHub Actions live 验证。随后完成 YAML 解析校验（issue_template_yaml_ok/workflow_yaml_ok），并在 `apps/danmu-universe` 成功执行 `pnpm generate:local-map`、指定测试命令与 `pnpm build`，输出已写入 task-5 evidence 文件。

## 2026-05-17 Task: season-guidance-hardening
已强化 `.github/ISSUE_TEMPLATE/tmdb-platform-mapping.yml` 的 TV 季号提示：当 `media_type` 为 `tv` 且为按季映射时，season 必须填写；仅在 `notes` 明确说明为 series-level 映射时才可留空，同时保留 `/ok` 与 `ANTHROPIC_API_KEY` 说明及稳定 field id。

## 2026-05-19 Task: final-wave-reject-f4-scraper-kit-exports
Fix verified: `@forward-widget/scraper-kit` now resolves workspace type/runtime entrypoints directly from `src/*.ts` via `package.json` `types` and `exports` (`types` + `import` + `default`), so downstream local builds no longer depend on pre-existing `dist` artifacts.
