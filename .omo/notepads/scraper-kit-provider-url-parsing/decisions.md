# Decisions

## 2026-05-18 Task: session-start
- First implementation covers all providers: tencent, youku, iqiyi, bilibili, mgtv, renren.
- TDD is required: failing parser/consumer tests before implementation.
- Parser APIs return `null` for unsupported/invalid URLs and must not perform network calls.
- ID string generation must remain byte-for-byte compatible with existing BaseScraper behavior.
