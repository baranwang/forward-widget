# Decisions

## 2026-05-19 Task: session-start
- Use a single root export from `@forward-widget/scraper-kit` for this migration; no scraper-kit subpath exports as final state.
- Use dist-first package exports (`./dist/index.js`, `./dist/index.d.ts`) as final state.
- Keep matchers, widget entry, `Widget.tmdb`, env/process handling, and LITE/OpenCC selection app-side.
- Keep the app compatibility shim under `apps/danmu-universe/src/scrapers/index.ts` unless all app imports are explicitly migrated later.
