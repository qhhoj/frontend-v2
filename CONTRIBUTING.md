# Contributing

Why things are the way they are: [docs/decisions.md](docs/decisions.md).

## Stack

- API types: `openapi-typescript` 7.13.0 (exact) generates `src/api/generated/schema.d.ts` from the committed backend snapshot
- Vue 3.5, Vite 8, TypeScript 5.9 (strict, `noUncheckedIndexedAccess`), Vue Router 5, Pinia 4, @tanstack/vue-query 5, vue-i18n 11, Tailwind 4, lucide-vue-next, @fontsource fonts
- Versions are exact in `package.json`. TypeScript stays on 5.9: typescript-eslint 8 supports `<6.1`
- Tests: Vitest 5 + jsdom + @vue/test-utils

## Before you push

Run `npm run prepush`. It runs Prettier and ESLint `--fix` on the files you changed since `origin/main`, lowers the raw-element baselines (`raw-elements:shrink`) and runs the repo lint rules (`lint:tokens` and the others) in parallel. Commit what it changed. A PR that removes raw elements never fails CI for a stale baseline: `lint:tokens` only prints a notice, and only a count that goes up fails. PR and merge-queue CI lint only the changed files (`npm run lint:changed -- <base>`); pushes to `main` and the nightly run lint everything.

## Layout and names

- Feature code lives in `src/features/<area>/`: `<Name>Page.vue` (routed), parts as `<Name>.vue`, `<area>.queries.ts`, `use-<name>.ts`
- Shared UI in `src/components/`, pure helpers in `src/lib/`, backend access in `src/api/`
- Composables `use-<name>.ts` export `use<Name>`; stores `<name>.store.ts` export `use<Name>Store`
- Specs sit next to their file as `<file>.spec.ts`
- Meaningful names, no single-character identifiers (`id-length`); templates use `$t`, scripts `translate` from `@/i18n`
- YAGNI, DRY, KISS; one pattern per job (page -> queries -> api -> client)

## State and data

- Pinia holds client state only: `session`, `theme`, `appearance`, `locale`, `loading` (which parts are waiting on first data). Server data is never copied into Pinia
- vue-query keys: `[area, resource, params]` (`['problems', 'list', filters, lang]`); invalidate by prefix (`['submissions']`)
- Account-owned queries include the user id in the key (`profileKey(userId)`), and so does any list whose rows carry the viewer's own state (`['problems', 'list', viewer, ...]`); `useAccountCacheSync` (in the shell) is the only place that drops the cache, whenever the signed-in user changes: login, logout, expiry, impersonation or another tab signing in. It resets the mounted queries whose key lacks the new viewer (they refetch) rather than `clear()`, which does not tell them. The session store announces each change of account to the other tabs (`session-channel.ts`)
- Lists and polls keep the previous data while a new key loads (`keepPreviousData`, `placeholderData`), so a filter change or a failed poll does not blank the screen
- API calls go through `apiGet` / `apiGetPage` / `apiSend` / `apiUrl` (`src/api/typed.ts`): the route is a string literal with `{param}` placeholders exactly as in `src/api/generated/schema.d.ts`, `path`, `query` and `body` are checked against the backend document, and the result is the unwrapped `data`. They sit on `client.ts`, which sends `X-CSRF-Token` on unsafe methods, retries once on `csrf_failed`, unwraps the envelope and throws `ApiError { code, status, fields, issues, extra, retryAfterSeconds }`. Only `client.ts` and `typed.ts` may mention `apiRequest`/`apiPage` at all, so a namespace import, a re-export or a dynamic import fails too (`typed-calls.node.spec.ts`)
- Types come from the backend: `src/api/types/<area>.ts` holds aliases of `Schemas[...]` (`src/api/schemas.ts`) and `QueryOf`/`JsonBodyOf` derivations, nothing else; `handwritten-types.node.spec.ts` fails on a new `interface`, object type or literal union. A shape the backend does not own carries `/** @uiOnly <reason> */`. The scan covers `src/api/types` only; the client's own shapes (`PageMeta`, `ApiErrorDetails`, `RequestOptions` in `client.ts`, `PdfProbe`, the `events.ts` and `use-submission-status.ts` types) are client or UI state and stay hand-written
- A request body built field by field is typed `RequiredPart<Body>` for its always-sent members (`src/api/typed.ts`), never cast to the body, so a required member the backend adds fails typecheck
- After a backend change (the `api-drift` workflow or `npm run api:check -- --backend` goes red): pull the backend, `npm run api:gen`, `npm run typecheck`, fix every error. An error that is the backend's fault is never cast: `trustedUntilBackendFixed('M<n>-<nn>', value)` plus a section in `docs/api-mismatches/` (see `backend-ask.ts`); the backend ask goes to the "Backend asks" table
- `src/api/generated/*` is never edited by hand and never merged by a feature branch: it changes only in a `chore: sync api schema` commit that follows `npm run api:gen`
- Error text: `$t(errorMessageKey(error))`; add a message to `errors.<code>` in both locale files for a new backend code
- Realtime: hold a stream with `useLiveStream` (`src/api/events.ts`): a typed route or null, a handler per frame name, `cacheKey` for the reads a `resync` or `reconnect` refreshes; it owns opening, reopening, give-up (`paused`) and closing on scope end. Bursts settle with `createSettleWindow` (`src/lib/settle-window.ts`); follow a submission with `useSubmissionStatus`
- Redirects from the URL (`?redirect=`) pass through `safeRedirect` (`src/router/safe-redirect.ts`) before any navigation
- Official contest mode is read only through `useOfficialMode()` (`src/features/official-mode/official-mode.queries.ts`). A control whose backend route answers `locked_in_official_contest` (or one of the older official-mode `forbidden` locks) calls `useOfficialLock()` once, binds `v-bind="lock.lockAttrs.value"`, guards its click with `lock.isLocked.value || action()` and renders `<OfficialLockNote v-if="lock.isLocked.value" :id="lock.noteId" />`
- Notification reads live under `['notifications', viewer]`; the bell owns the one `/events/user` stream of a tab, so no other component opens it

## Loading states

- A card, list or table that waits on a query uses `QueryState :loading="isPending"` and fills its `#skeleton` slot; no loading text. Pass the query's `isPending`, never `isFetching`: background refetches, polls and kept data must not show skeletons or Bits
- Only pass `isPending` for an enabled query: it stays true while a query is disabled or paused offline. For a query that can be disabled, pass `isLoading`
- Adding a skeleton for a new card: copy the loaded markup's wrapper elements (same text, spacing and grid classes), replace each text line with `<SkeletonBlock text class="w-..." />` inside the element that carries the font classes, replace avatars, badges and tiles with fixed-size `SkeletonBlock` (`round` for circles), and repeat rows as many times as the query's page size. Heights then match without magic numbers
- The Bit swarm and the live region live once in the shell (`LoadingLayer`); pages never mount their own. A new route is covered automatically (navigation and `QueryState` register as waiting sources)
- Tests that need a page to stay loading: `hangRequestsExcept([...])` (unit)

## Styling

- Components use the semantic utilities from `src/theme/styles.css` only (`bg-surface`, `text-content`, `text-muted`, `border-line`, `rounded-card`, `font-display`, ...). Tailwind's own palette, fonts and radii are removed
- No colour literals outside `src/theme/palette/*.css` (generated; specs excepted): `npm run lint:tokens` fails on them. Bit's sprite palettes in `src/mascot/bit-sprite.ts` are the only exception (sprite colours, like an image asset); `lint:tokens` skips that one file
- Classes picked at runtime come from a static `Record<..., string>` map (Tailwind must see the full class names)
- Card: `Card` (an opaque hairline card); user-written HTML (posts, comments, about pages) goes in `UserContent`, which contains it (see decisions)
- Overlays (menus, popovers) are opaque `bg-surface-solid`
- Dialogs, popovers, menus and pick-lists are the kit's own (`src/components/ui`: native `<dialog>`, the Popover API); no UI library
- Screens are built only from an approved mock-up; others get logic and plain placeholder markup

## Change the palette

Colours are generated. `scripts/palette/paper.mjs` holds the base inputs and `scripts/palette/palettes.mjs` the twelve palettes a visitor can choose (the first, Catppuccin, is the default) as overrides of it (grounds, neutral hue, the five accents, verdict lanes, tags, tiers, medals, syntax as OKLCH hue and chroma); `scripts/palette/solve.mjs` solves each lightness against its contrast floor; `npm run palette` writes `src/theme/palette/<id>.css` per palette (both modes, high contrast, accents) and `swatches.ts` (the picker's cards). The default palette is in the main stylesheet; the others load when chosen (`src/theme/palette.store.ts`, `html[data-palette]`, kept in this browser). Never edit those files: `npm run lint:palette` (part of `npm run lint`) fails on a failing pair or a file that differs from a fresh build. Roles that reuse a palette colour (status, limits, retired Clay names) are aliases in `src/theme/tokens.css`; `themes.node.spec.ts` checks the composed cascade and those aliases.

- Modes are `light` and `dark` (`THEMES` in `src/theme/registry.ts`); a preference may also be `auto` (follows the device). The retired `clay-*` and `glass-*` ids map through `LEGACY_PREFERENCES`; the backend maps stored ones on read
- The pre-paint script in `index.html` keeps each mode's ground in `grounds`, the legacy maps and the accent and background lists; `src/theme/prepaint.spec.ts` fails when they drift

## Appearance (personal look)

- A visitor's own look is `{accent, contrast, background}` (`src/theme/appearance.ts`). No look means the site's own (ultramarine, the device's contrast, Blueprint)
- `appearance.store.ts` paints it (`data-accent`, `data-contrast`, `data-background` on `<html>`). `useAppearanceChoice` is the only way the UI changes the look: paint at once, then save `{ appearance }`. `useAccountAppearanceSync` (called in the shell) applies the account's value, which outranks the browser's; `null` there means the site look. Anonymous visitors keep it in localStorage (`qhhoj.appearance`); `qhhoj.paintedAppearance` is what the pre-paint script paints
- Mode is not part of the look: it is the theme preference (`siteTheme`), changed through `useThemeChoice` by `ModeChoice`. Both savers go through `useProfileSave` (`src/features/account/use-profile-save.ts`), which drops an answer that a newer save overtook
- `src/theme/legacy-look.ts` moves this browser's Clay or Glass values before the stores start; `main.ts` shows one toast when it moved a choice
- Add an accent: its hue and chroma in `PAPER.accents`, its id in `ACCENTS`, the label under `appearance.accent.<id>` in both locale files, the id in the pre-paint script's `accents` list (`prepaint.spec.ts` checks it) and in the backend's `APPEARANCE_ACCENTS`; then `npm run palette`
- Swatches: `<span :data-accent="id" class="bg-accent ...">` shows that accent's colours without any colour in the component

## Accessibility

- Text 4.5:1 (7:1 at high contrast) on every ground, proven by `npm run lint:palette`
- Never remove the focus ring; real `<button>`/`<a>`; `aria-label` on icon-only buttons; icons `aria-hidden="true"`
- Meaning never by colour alone: verdicts carry their code and a spoken label; ranking cells `+n`/`−n`/`?n` plus a label
- Touch targets at least 44 px (`min-h-11`, `size-11`); wide tables scroll inside their card
- `prefers-reduced-motion` and `prefers-contrast: more` are handled in the token layer and the pre-paint script; do not add motion that bypasses `--qh-duration`. The loading indicators are the exception: the Bit swarm runs on `requestAnimationFrame`, and the skeleton pulse and Bit's sob and tear animations keep their own durations; all of them stop under reduced motion

## i18n

- Every string in `src/i18n/vi.json` and `src/i18n/en.json`, same keys and placeholders (`messages.node.spec.ts`)
- Pluralised keys take the count as the third `t()` argument
- Vietnamese is the default; statement `lang` params follow the UI locale
- Vietnamese spelling: the tone mark of an open oa/oe/uy syllable goes on the main vowel (hóa, hòa, xóa, khỏe, hủy, tùy, thủy; hoàn, thuyền and qu- syllables such as quý keep theirs) and quotations use “ ”; `npm run lint:copy` fails on the other forms in every `vi.json`. `ConfirmDialog` already says "Hủy" and "Xóa": do not pass a label that only restates them

## Testing

The frontend keeps unit tests only where it does math or where a bug would send wrong data: time, score and rating math, verdict mapping and the submit path. Do not add specs for components, pages or layout; UI is checked by agent scripts and review.

- Assert behaviour (rendered text, attributes, requests sent, invariants, errors), never replay constants
- A spec that needs no DOM (no mount, `document`, `window`, `localStorage`, no `setup.ts`) is named `<file>.node.spec.ts` and runs in plain Node (vitest project `node`); everything else is `<file>.spec.ts` in jsdom (project `dom`)
- Components and pages: `mountApp(path)` (whole app, memory router) or `mountComponent(component)`; stub the API with `mockApi({ 'GET /path': ok(data) })`; any unmocked request fails the test
- Fixtures in `src/test/fixtures.ts` are plain data with relative imports

## UI journeys

There is no browser test suite in this repo. UI journeys are checked by agent-run Markdown click-by-click test scripts, kept outside the repo.

## API types and drift check

`src/api/generated/` is machine-written from the backend's `openapi.json` (never edit it): `npm run api:gen` copies the backend document (`OPENAPI_SPEC`, default `../backend-v2/openapi.json`), records the backend commit in `openapi.source` and regenerates `schema.d.ts`. `npm run api:check` (part of CI and `npm run check`) fails when `schema.d.ts` is not what the snapshot generates; `npm run api:check -- --backend` also compares the snapshot with the sibling backend checkout and skips when there is none.

The `API drift` workflow checks out the latest `qhhoj/backend-v2` release tag (`gh api repos/qhhoj/backend-v2/releases/latest`; the backend deploys only on a release; public repository) and runs the same `--backend` comparison on pull requests, pushes to `main`, daily and on demand. It always runs; it is a required check on `main`. When it fails: if the PR needs unreleased backend changes, merge it after that backend release X exists and its deploy has run (check the backend Deploy workflow; the check proves the release exists, not that it is deployed: the deploy can wait up to 6 h for a running contest, and a manual dispatch can ship any ref); otherwise check out the release tag in `../backend-v2`, run `npm run api:gen`, fix the typecheck, open a `chore: sync api schema` PR.

## Releasing

There are no versions, changesets or release PRs. `main` is protected: changes land only by squash-merged PR, with signed commits and the required checks (`changes`, `scripts`, `check`, `drift`) green. Every push to `main` triggers `.github/workflows/deploy.yml`, which waits for CI on that commit, builds with `GIT_SHA` and deploys through `qhhoj-deploy` (`releases/sha-<12>` + `current` symlink). Two quick merges deploy in order; a deploy that has not started is cancelled by the newer one. A deploy deferred by a running contest (exit 75) is retried. Redeploy by hand with the `deploy` workflow (`ref`, `force` skips the CI wait). The footer shows the commit and build date.

## Commits

- One-line conventional subject: `feat: ...`, `fix: ...`, `test: ...`, `docs: ...`, `refactor: ...`, `chore: ...`
