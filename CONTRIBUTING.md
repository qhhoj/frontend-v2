# Contributing

Why things are the way they are: [docs/decisions.md](docs/decisions.md).

## Stack

- API types: `openapi-typescript` 7.13.0 (exact) generates `src/api/generated/schema.d.ts` from the committed backend snapshot
- Vue 3.5, Vite 8, TypeScript 5.9 (strict, `noUncheckedIndexedAccess`), Vue Router 5, Pinia 4, @tanstack/vue-query 5, vue-i18n 11, Tailwind 4, PrimeVue 4.5.5 (MIT, unstyled), lucide-vue-next, @fontsource fonts
- Versions are exact in `package.json`. TypeScript stays on 5.9: typescript-eslint 8 supports `<6.1`
- Tests: Vitest 5 + jsdom + @vue/test-utils; Playwright 1.63 + @axe-core/playwright

## Layout and names

- Feature code lives in `src/features/<area>/`: `<Name>Page.vue` (routed), parts as `<Name>.vue`, `<area>.queries.ts`, `use-<name>.ts`
- Shared UI in `src/components/`, pure helpers in `src/lib/`, backend access in `src/api/`
- Composables `use-<name>.ts` export `use<Name>`; stores `<name>.store.ts` export `use<Name>Store`
- Specs sit next to their file as `<file>.spec.ts`; e2e specs in `e2e/*.e2e.ts`
- Meaningful names, no single-character identifiers (`id-length`); templates use `$t`, scripts `translate` from `@/i18n`
- YAGNI, DRY, KISS; one pattern per job (page -> queries -> api -> client)

## State and data

- Pinia holds client state only: `session`, `theme`, `appearance`, `locale`, `loading` (which parts are waiting on first data). Server data is never copied into Pinia
- vue-query keys: `[area, resource, params]` (`['problems', 'list', filters, lang]`); invalidate by prefix (`['submissions']`)
- Account-owned queries include the user id in the key (`profileKey(userId)`); `useAccountCacheSync` (in the shell) is the only place that clears the cache, whenever the signed-in user changes: login, logout, expiry or another account taking over
- Lists and polls keep the previous data while a new key loads (`keepPreviousData`, `placeholderData`), so a filter change or a failed poll does not blank the screen
- API calls go through `apiGet` / `apiGetPage` / `apiSend` / `apiUrl` (`src/api/typed.ts`): the route is a string literal with `{param}` placeholders exactly as in `src/api/generated/schema.d.ts`, `path`, `query` and `body` are checked against the backend document, and the result is the unwrapped `data`. They sit on `client.ts`, which sends `X-CSRF-Token` on unsafe methods, retries once on `csrf_failed`, unwraps the envelope and throws `ApiError { code, status, fields, issues, extra, retryAfterSeconds }`. Only `client.ts` and `typed.ts` may mention `apiRequest`/`apiPage` at all, so a namespace import, a re-export or a dynamic import fails too (`typed-calls.spec.ts`)
- Types come from the backend: `src/api/types/<area>.ts` holds aliases of `Schemas[...]` (`src/api/schemas.ts`) and `QueryOf`/`JsonBodyOf` derivations, nothing else; `handwritten-types.spec.ts` fails on a new `interface`, object type or literal union. A shape the backend does not own carries `/** @uiOnly <reason> */`. The scan covers `src/api/types` only; the client's own shapes (`PageMeta`, `ApiErrorDetails`, `RequestOptions` in `client.ts`, `PdfProbe`, the `events.ts` and `use-submission-status.ts` types) are client or UI state and stay hand-written
- A request body built field by field is typed `RequiredPart<Body>` for its always-sent members (`src/api/typed.ts`), never cast to the body, so a required member the backend adds fails typecheck
- After a backend change (the `api-drift` workflow or `npm run api:check -- --backend` goes red): pull the backend, `npm run api:gen`, `npm run typecheck`, fix every error. An error that is the backend's fault is never cast: `trustedUntilBackendFixed('M<n>-<nn>', value)` plus a section in `docs/api-mismatches/` (see `backend-ask.ts`); the backend ask goes to the "Backend asks" table
- `src/api/generated/*` is never edited by hand and never merged by a feature branch: it changes only in a `chore: sync api schema` commit that follows `npm run api:gen`
- Error text: `$t(errorMessageKey(error))`; add a message to `errors.<code>` in both locale files for a new backend code
- Realtime: `openEventStream` (`src/api/events.ts`); follow a submission with `useSubmissionStatus`
- Redirects from the URL (`?redirect=`) pass through `safeRedirect` (`src/router/safe-redirect.ts`) before any navigation
- Official contest mode is read only through `useOfficialMode()` (`src/features/official-mode/official-mode.queries.ts`). A control whose backend route answers `locked_in_official_contest` (or one of the older official-mode `forbidden` locks) calls `useOfficialLock()` once, binds `v-bind="lock.lockAttrs.value"`, guards its click with `lock.isLocked.value || action()` and renders `<OfficialLockNote v-if="lock.isLocked.value" :id="lock.noteId" />`
- Notification reads live under `['notifications', viewer]`; the bell owns the one `/events/user` stream of a tab, so no other component opens it

## Loading states

- A card, list or table that waits on a query uses `QueryState :loading="isPending"` and fills its `#skeleton` slot; no loading text. Pass the query's `isPending`, never `isFetching`: background refetches, polls and kept data must not show skeletons or Bits
- Only pass `isPending` for an enabled query: it stays true while a query is disabled or paused offline. For a query that can be disabled, pass `isLoading`
- Adding a skeleton for a new card: copy the loaded markup's wrapper elements (same text, spacing and grid classes), replace each text line with `<SkeletonBlock text class="w-..." />` inside the element that carries the font classes, replace avatars, badges and tiles with fixed-size `SkeletonBlock` (`round` for circles), and repeat rows as many times as the query's page size. Heights then match without magic numbers; confirm with an e2e `boundingBox` comparison before and after (see `e2e/loading.e2e.ts`)
- The Bit swarm and the live region live once in the shell (`LoadingLayer`); pages never mount their own. A new route is covered automatically (navigation and `QueryState` register as waiting sources)
- Tests that need a page to stay loading: `hangRequestsExcept([...])` (unit), `api.hold('GET /path')` (e2e)

## Styling

- Components use the semantic utilities from `src/theme/styles.css` only (`bg-surface`, `text-content`, `text-muted`, `border-line`, `rounded-card`, `font-display`, ...). Tailwind's own palette, fonts and radii are removed
- No colour literals outside `src/theme/themes/*.css` (specs excepted): `npm run lint:tokens` fails on them. Bit's sprite palettes in `src/mascot/bit-sprite.ts` are the only exception (sprite colours, like an image asset); `lint:tokens` skips that one file
- Classes picked at runtime come from a static `Record<..., string>` map (Tailwind must see the full class names)
- Card: `GlassCard` (frosted in the Glass themes, a flat hairline card in Clay: the theme decides); user-written HTML (posts, comments, about pages) goes in `UserContent`, which contains it (see decisions)
- Overlays (menus, popovers) are opaque `bg-surface-solid`
- PrimeVue is unstyled; its look lives in `src/theme/primevue-preset.ts` with the same utilities
- Screens are built only from an approved mock-up; others get logic and plain placeholder markup

## Add a theme

Two families exist: **Clay** (flat, the default: `clay-light`, `clay-dark`) and **Glass** (`glass-light`, `glass-dark`). Copy the file of the family you want.

1. Copy `src/theme/themes/clay-light.css` (or a Glass file) to `src/theme/themes/<id>.css`. Keep only `:root[data-theme='<id>']` as the selector (the bare `:root,` fallback belongs to `clay-light` alone) and change the values (6-digit hex or `rgb()`/`rgba()` only; the `coin-*` and `gradient-accent` gradient stops must be 6-digit hex, `themes.spec.ts` reads them as such). Keep `--qh-blur` and `--qh-blob-display`: a flat theme has `0px`, `none`, `surface` equal to `surface-solid`, transparent blobs, a transparent `glow`, a one-colour `gradient-accent` and `chart-line-start: var(--qh-accent)`; a frosted theme has a blur in px, `block` and `chart-line-start: var(--qh-accent-2)`
2. In the same file add the seven accent presets, one rule per id in `ACCENTS` (`src/theme/appearance.ts`): `:root[data-theme='<id>'][data-accent='<accent>'], :root[data-theme='<id>'] [data-accent='<accent>'] { ... }`, each defining exactly the 14 accent tokens (`ACCENT_TOKENS` in `themes.spec.ts`: `surface-hover`, `line-accent`, `accent`, `accent-2`, `accent-text`, `accent-soft`, `accent-soft-text`, `on-accent`, `focus-ring`, `gradient-accent`, `glow`, `blob-1..3`; `first-solve-*` stays in the base rule, it never follows the accent). The rule for the theme's own preset (its registry `accent`, step 5) repeats the base values. A flat theme keeps every preset flat (transparent blobs, opaque `surface-hover`, a `gradient-accent` whose two stops equal its `accent`, an invisible `glow`). The second selector lets a swatch inside the page show a preset's own colours. Start from the file of the same family (`clay-*.css` or `glass-*.css`) and keep the hue of each preset
3. Set the six `--qh-syntax-*` colours (keyword, type, number, string, comment, function); they are drawn on the inner tile (`--qh-surface-strong` over the card)
4. Import it in `src/theme/styles.css` next to the others
5. Add `{ id: '<id>', labelKey: 'theme.<key>', scheme: 'dark' | 'light', glass: true | false, accent: '<preset id>' }` to `THEMES` in `src/theme/registry.ts`, and the label to both locale files. `accent` is the theme's own preset: the one whose rule repeats the base values, and where a personal look starts when it is turned on. `auto` (Clay) and `glass-auto` (Glass) resolve to the first theme of their style and the system scheme, so list the default first
6. Add `'<id>': '<its --qh-ground>'` to `grounds` in the pre-paint script in `index.html`; `src/theme/prepaint.spec.ts` fails on a missing id or a ground that differs from the theme file. If the theme becomes the default of its style and scheme, also change the fallback in the `var theme =` expression of that script (it builds `clay-` or `glass-` plus the scheme) and the static `theme-color` meta
7. `npm test`: `src/theme/themes.spec.ts` fails on a missing token, a CSS file that is not registered (or the reverse), a missing import in `styles.css`, the wrong `color-scheme`, a flat theme that is not flat (or a frosted one that is), duplicate syntax colours, or any text pair under 4.5:1 on the worst ground (every blob centre, glass, hover row, inner tile and the opaque fallback), now for every accent preset at five Glass levels (0, 25, 50, 75, 100) with blobs at full Glow, an accent fill or border under 3:1 on the ground, a preset with a missing or extra token, or a base that does not equal exactly the registry `accent` preset. A preset that fails gets new values (darker accent text in a light theme, weaker blobs in a dark one); the check is never loosened
8. Backend: nothing to do for the theme id. `siteTheme` accepts any id matching `^[a-z][a-z0-9-]{0,31}$`; the SPA resolves an id it does not know to the Clay theme of the OS scheme. The personal look has its own field (`appearance`, backend ask B25), independent of `siteTheme`

Stored values (`siteTheme` for signed-in accounts, the browser's preference otherwise): `auto` (Clay, follows the OS; the legacy default), `clay-light`, `clay-dark`, `glass-auto` (Glass, follows the OS), `glass-light`, `glass-dark`. The legacy `light` and `dark` resolve to `clay-light` and `clay-dark`, so existing accounts need no migration. The pre-paint script paints the last applied theme id (`qhhoj.resolvedTheme`) only when the account chose it (`qhhoj.resolvedBy` is `account`); otherwise it resolves the browser preference by today's OS scheme.

Change a palette: edit the values in the theme file and run `npm test`.

## Appearance (personal look)

- A visitor's own look is `{accent, glass, glow}` (`src/theme/appearance.ts`). It is opt-in: no look means the site's own theme, and turning it on starts from `siteLook(<the theme's registry accent>)`, which changes nothing visible
- `appearance.store.ts` paints it (`data-accent`, `--qh-glass-level`, `--qh-blob-strength` on `<html>`). `useAppearanceChoice` is the only way the UI changes the look: paint at once, then save `{ appearance }`. `useAccountAppearanceSync` (called in the shell) applies the account's value, which outranks the browser's; `null` there means the site look. Anonymous visitors keep it in localStorage (`qhhoj.appearance`); `qhhoj.paintedAppearance` is what the pre-paint script in `index.html` paints
- Style and Mode (Clay or Glass; light, dark or automatic) are not part of the look: they are the theme preference (`siteTheme`), changed through `useThemeChoice` by `ModeChoice`, and never turn the look on. Both savers go through `useProfileSave` (`src/features/account/use-profile-save.ts`), which drops an answer that a newer save overtook
- Glass and glow are derived in `tokens.css` (`--qh-surface-live`, `--qh-blur-live`) and consumed by `bg-surface`, `glass` and `blob-field`; unset, they equal the site look. Components never read `--qh-surface` or `--qh-blur` for glass
- Add an accent: its id in `ACCENTS`, a rule in every theme file, the label under `appearance.accent.<id>` in both locale files, the id in the pre-paint script's `accents` list (`prepaint.spec.ts` checks it) and in the backend's `APPEARANCE_ACCENTS`
- Swatches: `<span :data-accent="id" class="bg-gradient-accent ...">` shows that preset's colours without any colour in the component

## Accessibility

- Text 4.5:1 on every ground, checked per theme by `themes.spec.ts` and by axe in e2e
- Never remove the focus ring; real `<button>`/`<a>`; `aria-label` on icon-only buttons; icons `aria-hidden="true"`
- Meaning never by colour alone: verdicts carry their code and a spoken label; ranking cells `+n`/`−n`/`?n` plus a label
- Touch targets at least 44 px (`min-h-11`, `size-11`); wide tables scroll inside their card
- `prefers-reduced-motion` and `prefers-reduced-transparency` are handled in the token layer; do not add motion that bypasses `--qh-duration`. The loading indicators are the exception: the Bit swarm runs on `requestAnimationFrame`, and the skeleton pulse and Bit's sob and tear animations keep their own durations; all of them stop under reduced motion

## i18n

- Every string in `src/i18n/vi.json` and `src/i18n/en.json`, same keys and placeholders (`messages.spec.ts`)
- Pluralised keys take the count as the third `t()` argument
- Vietnamese is the default; statement `lang` params follow the UI locale

## Testing

- Assert behaviour (rendered text, attributes, requests sent, invariants, errors), never replay constants
- Components and pages: `mountApp(path)` (whole app, memory router) or `mountComponent(component)`; stub the API with `mockApi({ 'GET /path': ok(data) })`; any unmocked request fails the test
- Fixtures in `src/test/fixtures.ts` are plain data with relative imports; e2e reuses them
- SSE: `installFakeEventSource()` and `latestEventSource().emit(type, data)`
- E2E (`npm run e2e` or `npx playwright test`): Playwright builds `dist/` and starts `vite preview` on `127.0.0.1:4310` (or the port in `E2E_PORT`, for parallel runs), then stops it; outside CI it reuses a server already on that port. Any request the fake API (`e2e/fixtures/api.ts`) does not route fails the test
- E2E runs with `reducedMotion: 'reduce'`; wait for a visible element that only exists once the data has loaded, not for `networkidle`. Motion tests opt in with `test.use({ reducedMotion: 'no-preference' })`; the default stays `reduce`
- Playwright never kills processes by name; stop only the servers you started
- The shell reads `/site`, `/notifications`, `/notifications/unread-count` and `/tickets/summary` on signed-in pages: unit tests get `SHELL_DEFAULTS` (unrecorded) unless they route them, e2e gets the `FakeApi` defaults; count page streams with `pageStreams()`, the bell's stream with `userStream()`

## Real-backend e2e

Opt-in, never part of `npm run e2e` or CI: `E2E_REAL_API` adds the `real-backend` Playwright project (`e2e-real/*.real.ts`); the preview server then proxies `/api` to it. Without the variable the project does not exist.

Local stack (backend-v2 `README.md` "Run", `CONTRIBUTING.md` "Seed script"). Always use a scratch database (`qhhoj_e2e_real`), never a production-like name.

1. Mongo (replica set) and Redis, either way:
   - docker: `docker compose up -d mongo redis` in backend-v2 (`MONGO_URL=mongodb://localhost:27017/qhhoj_e2e_real?replicaSet=rs0`, `REDIS_URL=redis://localhost:6379`)
   - no docker: `mongod --replSet rs0 --bind_ip 127.0.0.1 --port 27018 --dbpath <empty dir> &`, once `mongosh --port 27018 --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"127.0.0.1:27018"}]})'` (or the same `replSetInitiate` command from any driver), and `redis-server --port 6390 --save "" &` (`MONGO_URL='mongodb://127.0.0.1:27018/qhhoj_e2e_real?replicaSet=rs0&directConnection=true'`, `REDIS_URL=redis://127.0.0.1:6390`)
2. Env for api and seed (backend-v2 shell): `NODE_ENV=development`, `ENCRYPTION_KEY` (64 hex), `TOKEN_SECRET`, `SITE_URL=http://127.0.0.1:4310` (the Origin the browser sends), `COOKIE_SECURE=false` (else Playwright's request context never sends the session cookie), `PORT=3100` (any free port; it must match `E2E_REAL_API`), and writable scratch dirs `MEDIA_ROOT`, `PROBLEM_DATA_ROOT`, `PDF_CACHE_ROOT`, `CONTEST_DATA_ROOT`, `USER_DATA_ROOT`
3. `npm run seed:e2e` (idempotent: `e2e_user`, `e2e_admin`, problem `e2e_sum`, language `PY3`), then `npm run start:dev`
4. `E2E_REAL_API=http://127.0.0.1:3100 npx playwright test --project=real-backend`. `reuseExistingServer` is on outside CI: a preview already on 4310 is reused even if it has no `API_ORIGIN`, so stop it first (only a server you started).

`E2E_USER`, `E2E_PASSWORD`, `E2E_PROBLEM`, `E2E_LANGUAGE` default to `e2e_user`, `e2e-user-pass-1`, `e2e_sum`, `PY3`. The submitted program is a Python `a + b`.

A verdict needs the worker, the bridge and a judge as well: start them as in backend-v2 `README.md` ("Run" table and "Submission flow"), then the test reaches AC. Without a judge the row stays `QU`: the test asserts `QU`/`P`, prints why it skipped the AC check, and waits 60 s first.

Resetting between runs: a queued row counts toward the unfinished-submission limit, so a second judge-less run fails at the submit step with 429 `unfinished_submission_limit` (the page shows "too many submissions waiting"). Clear it with `mongosh --port 27018 qhhoj_e2e_real --eval 'db.submissions.deleteMany({})'` (adjust the port), or drop the scratch database and re-run `npm run seed:e2e`.

`e2e_sum` has no archive and no `pdfStatementUrl`: never use it for data-editing tests; the PDF endpoint is probed directly.

## API types and drift check

`src/api/generated/` is machine-written from the backend's `openapi.json` (never edit it): `npm run api:gen` copies the backend document (`OPENAPI_SPEC`, default `../backend-v2/openapi.json`), records the backend commit in `openapi.source` and regenerates `schema.d.ts`. `npm run api:check` (part of CI and `npm run check`) fails when `schema.d.ts` is not what the snapshot generates; `npm run api:check -- --backend` also compares the snapshot with the sibling backend checkout and skips when there is none.

The `API drift` workflow checks out `qhhoj/backend-v2` `main` and runs the same `--backend` comparison on pull requests, pushes to `main`, daily and on demand. It needs the repository secret `BACKEND_READ_TOKEN`: a fine-grained token with read-only Contents access to `qhhoj/backend-v2` (Settings > Secrets and variables > Actions). Without the secret (or on fork PRs) the job logs a notice and skips; it is not a required check on pull requests. When it fails: pull the backend, run `npm run api:gen`, fix the typecheck, open a `chore: sync api schema` PR.

## Releasing

The app follows Semantic Versioning (`package.json` `version`, starting at 2.0.0): major = breaking API, protocol or DB migration; minor = feature; patch = fix.

- Every PR that changes behaviour adds a changeset: `npm run changeset` (pick the bump, write one line for the changelog) and commit the `.changeset/*.md` file. CI runs `npx changeset status --since=origin/main` on pull requests.
- Releases are automated (`.github/workflows/release.yml`): every push to `main` opens or updates the "chore: version packages" PR, which bumps `package.json` and `package-lock.json`, writes `CHANGELOG.md` and consumes the changesets. Review and merge it; the next run tags `v<version>` (`npm run release:tag`, idempotent) and creates a GitHub Release from the changelog section. Nothing is published to npm.
- One-time repo setting: Settings -> Actions -> General -> "Allow GitHub Actions to create and approve pull requests". The workflow uses only the default `GITHUB_TOKEN`.
- First release: the pending changesets were folded into the 2.0.0 entry, so the first Version PR is for the first change after 2.0.0.

## Commits

- One-line conventional subject: `feat: ...`, `fix: ...`, `test: ...`, `docs: ...`, `refactor: ...`, `chore: ...`
