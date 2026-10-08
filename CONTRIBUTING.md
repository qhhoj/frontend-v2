# Contributing

Why things are the way they are: [docs/decisions.md](docs/decisions.md).

## Stack

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

- Pinia holds client state only: `session`, `theme`, `locale`, `loading` (which parts are waiting on first data). Server data is never copied into Pinia
- vue-query keys: `[area, resource, params]` (`['problems', 'list', filters, lang]`); invalidate by prefix (`['submissions']`)
- Account-owned queries include the user id in the key (`profileKey(userId)`); `useAccountCacheSync` (in the shell) is the only place that clears the cache, whenever the signed-in user changes: login, logout, expiry or another account taking over
- Lists and polls keep the previous data while a new key loads (`keepPreviousData`, `placeholderData`), so a filter change or a failed poll does not blank the screen
- API calls go through `apiRequest` (single value) or `apiPage` (list) in `src/api/client.ts`; it sends `X-CSRF-Token` on unsafe methods, unwraps the envelope and throws `ApiError { code, status, fields }`
- DTO types are hand-written in `src/api/types/<area>.ts` with a `backend:` pointer to the response class, until the backend OpenAPI carries response schemas; then they are generated
- Error text: `$t(errorMessageKey(error))`; add a message to `errors.<code>` in both locale files for a new backend code
- Realtime: `openEventStream` (`src/api/events.ts`); follow a submission with `useSubmissionStatus`
- Redirects from the URL (`?redirect=`) pass through `safeRedirect` (`src/router/safe-redirect.ts`) before any navigation

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
2. Set the six `--qh-syntax-*` colours (keyword, type, number, string, comment, function); they are drawn on the inner tile (`--qh-surface-strong` over the card)
3. Import it in `src/theme/styles.css` next to the others
4. Add `{ id: '<id>', labelKey: 'theme.<key>', scheme: 'dark' | 'light', glass: true | false }` to `THEMES` in `src/theme/registry.ts`, and the label to both locale files. `auto` (Clay) and `glass-auto` (Glass) resolve to the first theme of their style and the system scheme, so list the default first
5. Add `'<id>': '<its --qh-ground>'` to `grounds` in the pre-paint script in `index.html`; `src/theme/prepaint.spec.ts` fails on a missing id or a ground that differs from the theme file. If the theme becomes the default of its style and scheme, also change the fallback in the `var theme =` expression of that script (it builds `clay-` or `glass-` plus the scheme) and the static `theme-color` meta
6. `npm test`: `src/theme/themes.spec.ts` fails on a missing token, a CSS file that is not registered (or the reverse), a missing import in `styles.css`, the wrong `color-scheme`, a flat theme that is not flat (or a frosted one that is), duplicate syntax colours, or any text pair under 4.5:1 on the worst ground (every blob centre, glass, hover row, inner tile and the opaque fallback)
7. Backend: nothing to do. `siteTheme` accepts any id matching `^[a-z][a-z0-9-]{0,31}$`; the SPA resolves an id it does not know to the Clay theme of the OS scheme

Stored values (`siteTheme` for signed-in accounts, the browser's preference otherwise): `auto` (Clay, follows the OS; the legacy default), `clay-light`, `clay-dark`, `glass-auto` (Glass, follows the OS), `glass-light`, `glass-dark`. The legacy `light` and `dark` resolve to `clay-light` and `clay-dark`, so existing accounts need no migration. The pre-paint script paints the last applied theme id (`qhhoj.resolvedTheme`) only when the account chose it (`qhhoj.resolvedBy` is `account`); otherwise it resolves the browser preference by today's OS scheme.

Change a palette: edit the values in the theme file and run `npm test`.

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
- E2E (`npm run e2e` or `npx playwright test`): Playwright builds `dist/` and starts `vite preview` on `127.0.0.1:4310`, then stops it; outside CI it reuses a server already on that port. Any request the fake API (`e2e/fixtures/api.ts`) does not route fails the test
- E2E runs with `reducedMotion: 'reduce'`; wait for a visible element that only exists once the data has loaded, not for `networkidle`. Motion tests opt in with `test.use({ reducedMotion: 'no-preference' })`; the default stays `reduce`
- Playwright never kills processes by name; stop only the servers you started

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

## Commits

- One-line conventional subject: `feat: ...`, `fix: ...`, `test: ...`, `docs: ...`, `refactor: ...`, `chore: ...`
