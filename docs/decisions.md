# Design decisions

What the code does and why. Conventions are in [CONTRIBUTING.md](../CONTRIBUTING.md); the spec is `docs/superpowers/specs/2026-10-08-frontend-design.md` (local, not committed).

## Stack and tooling

- Vue 3, Vite, TypeScript, Pinia, vue-query, vue-i18n, Tailwind 4, PrimeVue unstyled, Lucide — the SPA stack in the spec.
- PrimeVue 4.5.5 (MIT), not 5 — PrimeVue 5 ships under the PrimeUI commercial licence and needs a key.
- TypeScript 5.9, not 7 — typescript-eslint 8 supports `<6.1`; openapi-typescript 7 needs `^5`.
- `engines.node >= 22.13`, jsdom 29.0.0 — jsdom 30 needs Node 22.22.2+ (or 24.15+) and the dev machine runs 22.22.1.
- No `composite` in the tsconfigs — with it the e2e import of `src/test/fixtures.ts` fails with TS6307.
- Playwright on port 4310 (`E2E_PORT` overrides it for parallel runs), not vite's 4173 — a developer's own `vite preview` may hold 4173.
- The Playwright `webServer` runs the build, and CI has no separate build step — the build ran twice.
- Playwright `reducedMotion: 'reduce'` and explicit locator waits, no `networkidle` — deterministic motion; `networkidle` waits on nothing the user sees.
- E2E answers the API from the unit fixtures (`e2e/fixtures/api.ts`) — fast and deterministic; the real-backend run comes with submissions (8c).
- `npm audit`: 4 high in `braces` through `@vue/eslint-config-typescript` 14.9.0 — dev-only lint toolchain, never in `dist/`; the audit fix downgrades the config to 14.0.1, so it waits for a newer config release.

## Data, auth and routing

- Pinia holds client state only (session, theme, locale); server data lives in vue-query — one cache with invalidation, nothing to sync by hand.
- API types are generated: `openapi-typescript` 7.13.0 turns the backend's `openapi.json` (committed in the backend, snapshotted in `src/api/generated/openapi.json`) into `src/api/generated/schema.d.ts`; `src/api/typed.ts` types every call by route, so a backend change that breaks a page fails `npm run typecheck`. `src/api/types/*` are aliases only (`@uiOnly` for shapes the backend does not own).
- The existing client stays instead of `openapi-fetch`: CSRF retry, 401 and gate hooks, `ApiError` with `Retry-After`, the envelope unwrap and 204 live in `client.ts` and its 300-line spec; `openapi-fetch` returns `{ data, error }` instead of throwing and cannot retry, so it would need a wrapper as large as `typed.ts`.
- CI cannot see the backend repo, so the frontend commits the spec snapshot it generated from (`src/api/generated/openapi.json`, with the backend sha in `openapi.source`); `npm run api:check` (CI) fails when `schema.d.ts` is stale against it, the backend CI fails when its own `openapi.json` is stale, and the `api-drift` workflow (pull request, `main`, daily) fails when the snapshot differs from backend `main`'s `openapi.json`. `npm run api:check -- --backend` is the same comparison against `../backend-v2` locally.
- A backend mismatch found by the typecheck is never cast away: `trustedUntilBackendFixed('M<n>-<nn>', value)` marks the single use site, `docs/api-mismatches/<lane>.md` records it, `backend-ask.spec.ts` fails when an id has no section. The six asks of the migration (M2-01, M2-02, M5-01, M5-02, M7-01, M7-02) were fixed by backend `ba5db96`; none is open.
- Guard rails: `typed-calls.spec.ts` allows `apiRequest`/`apiPage` imports only in `client.ts` and `typed.ts`; `handwritten-types.spec.ts` (scanner `findHandWrittenTypes`) fails on an interface, enum, object type or literal union in `src/api/types` unless tagged `@uiOnly <reason>`.
- `fetch` wrapper, no axios — the needs are the envelope, a CSRF header and one retry.
- The CSRF token lives in memory only — storage would expose it to any script on the origin.
- `csrf_failed` reloads the session and retries once — a rotated cookie must not fail a click; parallel failures share one refresh and never loop.
- Session status `unknown | anonymous | partial | authenticated`; `/auth/me` 401 is anonymous, other failures keep the status unknown and retry on the next navigation — an offline backend must not lock out public pages.
- A 401 on a protected request signs the viewer out in the store — otherwise an expired session leaves the shell signed in while every request fails; there is no redirect at that moment, the next navigation applies the routing rules.
- Profile query runs only when authenticated with no password change pending — the guard answers every other request with 403 `password_change_required`.
- Account-owned queries keep the user id in their key and the cache is cleared in one place (`useAccountCacheSync`) whenever the signed-in user changes (login, logout, expiry, another account) — the next viewer must never see the previous account's data.
- `redirect` values pass through `safeRedirect`: only `/path`; `//`, `/\`, scheme URLs and arrays become `/` — open-redirect protection.
- A route takes `layout:'auth'` only when its page renders AuthLayout. The shell then drops the pill header and keeps blobs, loading layer and `#main`; set on any other page, the viewer has no nav, locale toggle or sign-out.
- Non-staff on `/admin/**` get not-found at the same URL — existence is not revealed. Admin is one lazy chunk.
- Guards route page navigations only; `two_factor_required` and `password_change_required` from an API call are turned into redirects through `onGateRequired` (reload the session, re-run the guard rules), so a gate set mid-session takes effect at once; `csrf_failed` only shows its message (both locales).
- Every existing account carries `siteTheme: 'light'` (schema default) — so the account theme must not overwrite a browser's own choice on sign-in (and `light` now resolves to Clay light; see Theme).

## Data reads

- `keepPreviousData` on the problem list and `placeholderData` on the ranking poll — a filter change or a failed poll keeps the screen filled.
- Ranking polls every 30 s only while the contest runs, and pauses in the background — no ranking event exists on the backend yet (B4).
- The running-contest card shows the most recently started running contest — `/contests?phase=running` is sorted `startTime desc`.
- A submission stream the server refuses or closes for good reads the stored row instead of reconnecting forever — EventSource otherwise retries every 3 s.
- `typeIds` in the problem list are UUID v7 only — the backend answers 400 to the whole list for any other UUID in `?type=`.
- Paging uses `meta.total`; `pp-breakdown` sends `hasMore` instead — documented on `PageMeta` so 8e does not assume `total`.
- Statement `lang` follows the UI locale and is always sent — the backend default is `en`.

## Theme

- Semantic tokens as CSS custom properties, one CSS file per theme, switched by `html[data-theme]` — new themes and palettes without touching components.
- Tailwind's palette, fonts and radii are removed and colour literals are linted out of components (`lint:tokens`) — every colour goes through a token.
- Theme invariants are tested: every token defined, text at 4.5:1 on the worst ground (blob centre, glass, hover), coin text on both stops of every coin gradient — a palette cannot ship unreadable.
- Glass mock-up colours adjusted: blob peaks 24 % (pink) and 28 % (violet), muted text `#CFC5EA` (mock-up `#B7A9D6` measured 4.11:1), link text `#FDB8FF` (mock-up `#FC72FF` measured 3.82:1).
- Clay & ivory is the default direction (user pick, mock-up "Palette", third option); Glass stays selectable as `glass-light` / `glass-dark` — one registry, two families, no component forks.
- Flatness is tokens only: per-theme `--qh-blur` and `--qh-blob-display`, Clay `surface` = `surface-solid`, transparent blobs, a one-colour `gradient-accent`, an invisible `glow`; `ThemeDefinition.glass` marks the families — `GlassCard`, `.glass` and `bg-surface` render flat in Clay with no code change.
- `auto` follows `prefers-color-scheme: dark` and anything else (light, no preference, no `matchMedia`) is light — Clay is light-first; the old default of dark belonged to Glass.
- Stored values are the theme ids plus the two OS-following values of each style: `auto` (Clay), `glass-auto`, `clay-light`, `clay-dark`, `glass-light`, `glass-dark`. The legacy `light` / `dark` that every existing account holds resolve to Clay, so nothing is migrated and the backend, which accepts any id of the pattern, needs no change.
- The six `siteTheme` preferences are shown as Style (Clay, Glass) × Mode (Light, Dark, Automatic) in the header's appearance panel (see Appearance).
- Clay mock-up values adjusted by measurement: link and focus ring `#B4532F` to `#A64A28`, AC/positive `#15803D` to `#166534`, `tier-master` `#B45309` to `#9A3412`, `accent-2` `#D97757` to `#9A3F22`, dark button text charcoal `#1A1816` instead of white — never by loosening the spec.
- Syntax tokens (`--qh-syntax-*`) live in the four theme files since this change (8c reuses them); Glass values moved: dark comment `#C4B9E0`, light number `#7C5200`, light function `#09617F`.
- Clay's first-solve tint is gold/amber (Bit's accent family) with the star kept, so it reads apart from the red wrong-answer tint; `themes.spec.ts` checks the hue gap and 4.5:1 text. The ranking legend names no colour: a swatch and the star.
- Hairlines stay decorative (`#E8E2D8` is 1.2:1 on ivory, like Glass's 10 % white): inputs and inner tiles are told apart by `surface-strong`, not by their border; menus, Select and popovers use `line-strong` so they separate from white cards.
- Theme preference resolves through the registry: `auto`, `glass-auto`, a stored value or a theme id; an unknown value falls back to the Clay theme of the OS scheme — legacy and backend values always render; the legacy `light`/`dark` resolve to Clay.
- `choose()` is a user action: it applies the theme and remembers it in this browser; signed in, the mode control also saves it as `siteTheme`, and a failed save keeps the local choice — the account is the cross-device truth.
- `adopt()` applies the account's theme without writing the browser preference — the account default must not overwrite the browser's own choice on each sign-in; `adopt(null)` on sign-out returns to the browser choice, then the OS.
- The store writes `qhhoj.resolvedBy` (`account` or `local`) with `qhhoj.resolvedTheme`. A cached theme is held at start-up only when the account painted it, until `adopt`, `choose` or an OS scheme change releases it — a signed-in account's theme never flashes; `auto` and `glass-auto` resolve by today's OS scheme, so an OS change between visits does not repaint.
- The pre-paint script in `index.html` applies the last painted theme id (`qhhoj.resolvedTheme`) when `qhhoj.resolvedBy` is `account`, else the local preference — no flash of the wrong theme. It repeats the registry ids and each theme's ground (address-bar colour); `prepaint.spec.ts` enforces that they match.
- Glass: reduced transparency: card surface opaque and blur 0; no `backdrop-filter` support: card surface opaque, inner tiles and hover rows keep their Glass tint (Clay is always opaque); reduced motion: durations 0 — glass stays readable.
- Background blobs: phones get two 300 px blobs; blob-3 is hidden below 768 px wide or at 759 px high and under — on narrow or short screens its centre would sink into blob-2 and break contrast.

## User content

- `UserContent` containment is load-bearing: `overflow: clip; contain: paint inline-size; isolation: isolate; min-width: 0`, with pre, `.katex-display` and tables scrolling inside the box — sanitized user HTML cannot paint, size or stack outside its box.
- The backend sanitizer must keep blocking the `popover` attribute — a popover opens in the top layer and escapes the containment.
- `v-html` only in `UserContent`; no 8a route renders it yet. Other backend strings are rendered as text.

## Screens and mock-up deviations

- Screens without an approved mock-up ship as logic plus plain placeholder markup — visuals come from mock-up rounds.
- Home: "Top rating" (top 3 by rating) replaces "Top tuần" — there is no weekly board (B7).
- Home: the rating delta is the change at the last rated contest — ratings move per contest.
- Home: no quick submit card (removed; the user found it unnecessary), so the rating hero spans the full row and submitting lives in the problem submit dock.
- Ranking: podium medals use the `coin-3`/`coin-6`/`coin-5` tokens, not the mock-up's gold, silver and bronze gradients; the viewer's own row is `bg-surface-hover`, not a pink tint — both stay inside the theme tokens.
- Problems: no "Chưa giải" chip — no unsolved filter (B6); the points range is a popover with two number inputs; columns sort on click.
- Problems: the `attempted` label stays "Đã thử" — ruling from the Task 3 review.
- Ranking: the contest tabs become a contest sub-nav under the shared header.
- Ranking: usernames take a tier colour only when the row carries a rating, and the organization caption is omitted (B5).
- Ranking: points formats (default, ioi, ioi16, ultimate, final_submission) reuse the ICPC cell style until their mock-ups exist.
- Ranking cells are read per format: icpc `{time, points, tries, pending: boolean}` with cumtime in minutes; vnoj `{time, points, penalty, pending: count}` with cumtime in seconds — `rankingCell` is the only place that knows.
- Ranking: a failed poll keeps the board on screen; a frozen board shows the frozen banner and `?n` for withheld results.

## Accessibility

- Text 4.5:1 on every ground, large text 3:1; the focus ring is never removed; touch targets at least 44 px.
- Verdicts carry their code and a spoken label; ranking cells carry their sign and a label — colour is never the only signal.
- Menus and popovers return focus to their trigger on Escape.
- Theme and account menus set `aria-haspopup` and `aria-expanded`.

## Submission errors

- B9 landed: `banned_from_problem`, `contest_submission_limit`, `unfinished_submission_limit` and `rate_limited` have their own `errors.*` messages; field refusals map by `issues[].code` (`submitErrorKey`), never by the English text.
- A banned login shows the moderator's reason from the error's `extra.banReason` (B8), else the generic ban message.
- Unknown backend codes show `errors.generic`.

## Appearance

- The personal look is opt-in: no look (`appearance` null) is the site's own theme, so the designed theme stays the default and the mode stays a separate preference.
- Accent presets only, no free colour picker: each preset is contrast-checked in all four themes, and a free colour cannot be checked in advance.
- Presets are `[data-accent]` token overrides in each theme file (they also match a descendant swatch), so `themes.spec.ts` checks them (`lint:tokens` keeps colours out of components) and a swatch needs no colour in a component.
- Glass is one 0-100 value: the theme surface is mixed toward `--qh-surface-solid` and the blur scaled down; Clear, Frosted and Solid are 0, 50 and 100, one knob for the slider and the segments.
- Glow is the opacity of the blob layer; 100 is the site's blobs, so the contrast worst case (full blobs) needs no extra maths.
- Each theme names its own preset (`accent`: Clay for Clay, Orchid for Glass) and its base equals that preset, so turning the look on changes nothing until a control moves.
- `first-solve-*` is not an accent token: each theme keeps its own trophy tint under every preset, as it keeps its verdict colours.
- Glass and Glow are inert in the flat Clay themes; their controls are disabled with a reason rather than hidden, and the stored values are kept for a Glass theme.
- Style × Mode saves `siteTheme` only and never turns the look on: mode existed before and is not "my own look".
- Theme and look saves share one sequencer (`useProfileSave`): each answer carries the whole profile, so a late answer to an older save must not overwrite a newer one.
- The account's look outranks the browser's, and `null` there means the site look; signed out, the browser's own look (localStorage only).
- The pre-paint script validates `qhhoj.paintedAppearance` and paints the site look for anything invalid: no flash, no broken first paint.
- Reduced transparency needs no rule of its own: the live tokens derive from the surface and blur that the existing media query already forces solid, so the personal Glass level cannot undo it.
- The header appearance panel (PrimeVue `Popover` with `FocusTrap`) replaces the theme menu, so Style and Mode live in one place.
- `/settings/appearance` is public: anonymous visitors can use the look.
- The panel is opaque (overlay rule), and disabled controls keep full-contrast labels with no `opacity` (axe measures it).

## Backend asks

| # | Ask | Unblocks |
|---|---|---|
| B1 | OpenAPI response schemas (`dtoFileNameSuffix` including `.response.ts`, fix circular refs, paginated response helper) | done: backend-v2 emits openapi.json (plan 2026-10-09-openapi-generated-sdk); types are generated |
| B2 | `siteTheme` (and `languageId`) on `GET /auth/me` | one request fewer at boot |
| B3 | `siteTheme` default `auto` for new users; accept registered theme ids | done in backend-v2 263ec51 (`SITE_THEME_PATTERN`: any `^[a-z][a-z0-9-]{0,31}$`) |
| B4 | `ranking` event on `contest-events` after a participation recompute | live ranking without polling |
| B5 | `rating` and first organization short name on ranking row users | tier colours, captions |
| B6 | `solved=false` filter on `GET /problems` | "Chưa giải" chip |
| B7 | Weekly top users, or drop the idea | home "Top tuần" |
| B8 | Login ban error carries a structured `banReason` (the frontend parses `Reason:` text today) | done in backend-v2 ba8890a: the login screen reads `error.extra.banReason` |
| B9 | Distinct error codes for the per-user rate limit, the unfinished-submission limit, a problem ban and a contest submission cap | precise submit messages |
| B25 | `appearance: {accent, glass, glow} \| null` on `GET/PATCH /profile` and `/auth/me` (accents `clay, orchid, ocean, mint, sunset, gold, mono`) | done in backend-v2 27c7485 (`APPEARANCE_ACCENTS`, `null` clears) |
| A1 | `email_invalid` issue code on the reset email (`PasswordResetRequestDto.email` sends the bare `email.matches`) | the reset address text without the alias in `ISSUE_ALIASES` |
| A2 | `open` filter on `GET /organizations` (the signup list reads every page and filters here) | server-side filtering of the school picker |
| A3 | Provider name and email on the social completion screen (the client never learns them) | the provider line and the email on `/register/social` |
| B-8f6 | Data version on `ProblemDataResponse`; a listing of uploaded statement images; structured `feedback` (case index + code) | problem data tab version, image picker, per-case feedback |
| B-8f2-1b | Per-sub-field issues for object settings (a type error is one issue on `value`) | field-level errors in a settings block |
| B-8f2-2 | Server-side checks for misc config values (URL keys, analytics snippet) and an admin read with `no-store` | no client-only validation |
| B-8f2-3b | A global audit read for the change log | `/admin/log` without choosing a key |
| B-8f2-6b | Organization delete | a delete button on the organization panel |
| B-8f2-7b | A report queue for blog moderation (no report model) | a reports tab |

## Loading states

- Loading: `QueryState` shows a caller-supplied skeleton instead of text; blocks are `aria-hidden` and one shell live region announces once, because per-card regions would announce once per card.
- Loading: "waiting" is a registry of sources (`QueryState` while `isPending`, plus an in-flight navigation), not `useIsFetching`, because refetches, polls and kept-data filter changes must never show mascots.
- Loading: Bits appear after 600 ms of continuous waiting and a 100 ms gap does not break it, so fast pages stay calm and the tick between navigation end and the page's queries is not read as "done".
- Loading: 5 Bits (3 under 768 px) random-walk over the viewport with one shared rAF loop, dt-capped at 100 ms, paused in hidden tabs, because one loop is cheap and a stalled frame must not teleport them; they stop, blink once, hold 1.5 s and fade 300 ms.
- Loading: under reduced motion one Bit (the cap) stands in the bottom-left corner without blinking and, after the hold, disappears with no fade: wandering is motion, `mascot.md` disables blinking, and the global 0 ms transition rule ends the fade before it starts.
- Mascot placements: `BitMascot` is a fixed 16-pixel box (a blink never shifts layout) and decorative unless given a label; the home hero Bit wears the cap and blinks every 4 s (not under reduced motion), because mascot.md lists it as the home placement.
- Mascot placements: a crown on AC and a sweat drop with closed eyes on WA, TLE, MLE, RTE, OLE, IR, CE and in `QueryState` errors, because mascot.md ties them to success and failure; system outcomes get no Bit.
- Mascot placements: every empty list uses the shared `EmptyState` (asleep nightcap, charcoal twin), so a new list gets the mascot by using one component.
- Mascot: `src/mascot/bit-sprite.ts` is the single source of Bit's pixels and the only source file outside `src/theme/themes/` that `lint:tokens` skips, because Bit keeps its sprite colours in every theme like an image asset.
- Motion: skeleton pulse, Bit sob and tears use their own durations and switch themselves off under reduced motion, because `--qh-duration` is 0 there and would freeze them mid-frame instead of removing them.
- 404: `NotFoundPage` (crying Bit, pale 404) replaces the placeholder on the catch-all route; the mascot's 404 variant is crying, not a magnifying glass (user's pick "404 B").
- More Bit: `InlineBit` (48 px, decorative) sits beside short notices (sweat: forbidden, stream stopped, refresh failed, activation failed; crown: account activated; nightcap: placeholder pages) and `EmptyState compact` fills the home cards' empty texts, because a notice beside its words needs no second label; per-row verdict Bits stay out as too noisy.
- More Bit: the crown keeps open eyes (`mascot.md`: Accepted) while sweat and asleep shut them, and `EmptyState compact` renders `InlineBit kind="asleep"`, so the 48 px asleep Bit is defined once and its home-card copies are decorative because the words beside them say the list is empty.

## Problems and submissions

- CodeMirror 6, not Monaco (spec): about an order of magnitude lighter, tokens-themable, works on touch and under magnification; lazy chunk, coloured through the existing --qh-syntax-* tokens (8a2) with per-language lazy packs, one chunk each, none preloaded. Measured gzip (editor harness build): core editor 84.2 KB (state, view, language, highlight) + 8.5 KB (`code-editor-cm`), shared parser runtime 8.8 KB (+3.2 KB autocomplete shared by python, javascript, go); packs cpp 32.9, javascript 32.3, rust 29.3, java 18.7, python 18.5, go 12.3 KB. Pascal and other languages without an official pack render plain.
- Discussion tab waits for 8e (comments are page-generic and need a threads mock-up).
- Submit success goes to /submissions/:id; Nộp lại goes to /problems/:code?resubmit=<id>.
- PDF: the button prepares it in the page (poll the PDF URL no faster than every 3 s, 202 + Retry-After while rendering, B20), stops on 503 pdf_unavailable and 429, gives up after 120 s, then offers "Open PDF"; no percentage.
- Editor coloured from the start: the --qh-syntax-* tokens of every theme, lazy language packs, plain text for languages without a pack.
- Phone submit is a bottom sheet under 768 px; file-only languages submit a file (multipart, language id, B17); fileSizeLimit 0 means uploads off, as on the server.
- Submit form state is split into one composable per concern (language, template, file, resubmit) behind `useSubmitForm`; the dock reports its height as `--dock-height` and starts expanded each page load (no storage).
- Submission list: stats strip (B24), URL-synced filter rail, live updates over the public feed with a throttled refetch.
- Contest context (B19) shows only the attempts left in the dock; no banner until 8d.
- Dates from the API show as UTC calendar dates (the SPA does not know site.timeZone); instants (submission time) show in the viewer's own time zone, so a contestant in Vietnam sees 14:05 for 14:05.
- Nộp lại shows only on the viewer's own submissions; the problem Submissions tab's "View all" goes to `/submissions?problem=<code>&user=<me>`, because the tab lists the viewer's own rows.
- Navigating to another path moves focus to `#main` (router `afterEach`), so focus never falls to the body after a submit; query-only changes keep their own handling. Problem and submission pages name the tab (`usePageTitle`).
- Chunks: language packs are `code-lang-<name>`, the CodeMirror core is `code-editor-core`, so a network tab says what they are; all stay lazy and unpreloaded.
- Header nav: at phone widths items use `px-2 text-sm` so all five fit at 375 px; at 320 px the pill still scrolls on its own.
- E2E: `FakeApi` matches `:param` keys (an exact key wins), records every request in `requests` and serves PDF and event-stream replies; the editor and language packs must never be modulepreloaded (`bundle.e2e.ts`).
- Real-backend e2e is a separate opt-in Playwright project (`E2E_REAL_API`, `e2e-real/`), so the fake-API suite and CI never depend on a running backend; without a judge it asserts `QU`/`P` and says why it skips the AC check.

## Contests (8d)

- Each contest tab is its own route; a tab page renders `ContestTabs` itself and passes the contest phase, so every tab keeps the announcement stream and its paused notice.
- Contest instants show in the viewer's own zone (`formatClock`, `formatDayMonth`); the contest's day is the viewer's day, so a late-evening contest keeps its own date.
- Detail and list keys carry the viewer id: one account's join state never shows to another on the same browser.
- After backend 4c the detail's actions read `viewer.liveStatus`/`isCurrent`; the client-side copy of `liveStatusOf` is gone.
- E2E: `e2e/contests.e2e.ts` covers the list, the detail (390 px layout A, access-code dialog under axe), announcements over SSE and the points cells; every contest page is in the axe and phone-layout lists, and the contest fixtures run on a clock pinned inside Round #42 (`CONTEST_FIXTURE_NOW`).
- The list and detail read backend 4c's viewer fields (`viewer.liveStatus`, `isCurrent`, `viewerResult`, `solverCount`): the list's own state and the problems table's own result and solver count come from the server, not from the client.
- Solver counts hide their column when every count is null: the viewer may not see the full ranking, so a column of dashes would read as zeros.
- Every contest refusal code has its own text, and `access_code_required` opens the code dialog instead of only showing the text: the user can act on it in place.
- The own-only submissions banner waits for backend ask B-8d1 (`viewer.canSeeFullSubmissionList`): until then the client infers "only your submissions" and the backend narrows silently.
- Bit placements: nightcap on empty lists, sweat on refusals, crown on the solved summary, crying when the contest is missing; the podium and countdown Bits sit on the ranking and the header.
- The user-picked mock-up wins over the brief where they differ: the picked look is what the user reviewed, so it is the target.
- "Cần mã" chip shows on list rows only: the detail header's action already says the code is needed, so a chip there would repeat it.
- Visitors get the signed-in label on list rows and link to the detail page: the list runs the action with the signed-in rules, and the detail page decides what a visitor can actually do.
- The own-result column shows only when the server sends results: a hidden board and a viewer with no participation both arrive as all-null `viewerResult` (backend `contest-problem-facts.service.ts:46-52`), so the client cannot tell them apart and draws no "hidden" state.
- `ConfirmDialog` is shared: one confirm step for destructive choices and input prompts (the access-code dialog is built on it), so busy, Escape, the labelled close button and focus return behave the same on every confirm.

## Avatars

- Every user's avatar is a Bit hashed from the username (scheme C, 24 576 looks), not uploads: no storage, moderation or image pipeline, and the same name shows the same face everywhere.

## Bit mascot

- Bit variants: the nine approved options (judging, contest, rankUp, welcome, envelope, writing, security, staff, community) play their preview loops from frames copied into `src/mascot/bit-frames.ts`, one timer per on-screen Bit and frame 0 under reduced motion; the other 18 options stay in mascot.md's Reserve.

## Known gaps (later sub-projects)

- Session expiry mid-page does not redirect: the store signs out and the page keeps showing until the next navigation, to avoid yanking a viewer who is typing.
- Admin screens — plans 8f-1 and 8f-2.

## Community (8e)

- Routes: each tab of `/users/:username` and `/organizations/:slug` is its own child record under a layout, so every tab is a shareable URL; the leaderboard sorts live in the query string.
- Legacy links: `/post/:id`, `/user/:username`, `/ticket/:id`, `/problem/:code`, `/problem/:code/editorial` and `/contest/:key` redirect to their new records, keeping the hash, so mails, Discord and feeds keep working; `/tagproblem/:code` has no screen and shows the 404 page.
- Header nav: Organizations joins the pill as a sixth item, drawn on every board; at 375 px the pill keeps scrolling on its own (8c rule).
- Avatars: scheme C (user pick) hashes the username into a Bit, built outside 8e; 8e only places `UserAvatar` (rows 28 px, comment and message headers 32 px, profile header 96 px) and keeps `TokenCoin` for problem and language coins; a deleted author keeps the grey fixed look at the same width.
- Bit states: `StatePanel` kinds map to Bit variants (empty: nightcap, communityEmpty: trio, error: sweat, signIn and forbidden: security, notFound: crying, success: crown, sent: envelope, staff: staff) in `src/mascot/state-bits.ts`, the only place to swap variants; the sweat Bit no longer stands in for 401, 403 and 404.
- Pager: numbered links (`?page=`) with a window around the current page, shareable and working without JS; without a total (PP tab) the last page is the next one while more entries exist.
- Votes: the pressed arrow withdraws the vote; the viewer's own text and anonymous viewers see the control disabled; a 403 (too few solved problems) and a 429 show the server's message and restore the previous score, because the gate is not exposed to the SPA.
- Leaderboard: sort tabs as links, columns collapse under 768 px to rank, user and the active column; the tier legend reads `RATING_TIERS` and `TIER_LOWER_BOUNDS`, so colours and bounds have one source; there is no search API, so "go to profile" uses the exact username.
- Profile: owners see edit and write actions, others see the ban action for judges (reason required, 4096 characters at most); the comments tab shows only to viewers allowed to see every user's comments; the PP footer drops "100" because the backend keeps up to 300 entries.
- Rating chart: SVG with tier bands from `TIER_LOWER_BOUNDS`, a summary `aria-label`, and hidden contests left out, because the chart must not reveal contests the viewer cannot see.
- Heatmap: 53 Monday-first weeks ending on the viewer's today in the activity's time zone, levels by quarters of the busiest day, each cell carrying its date and count in a title, so the grid reads the same across zones.
- Organizations: the join panel counts the viewer's open organizations (up to 3, from the viewer's own list) and shows the slots; 409s on join, leave and request show the action that failed, because the server decides and the SPA only explains.
- Blog: feed tabs `global` and `all`, vote control, pinned chip, author card and "other posts" on the post page; edit and delete have no board yet, so they are not built.
- Comments: roots newest first, replies indented up to four levels, collapsed rows (score at or below -5) folded, deleted accounts shown as deleted, replies hidden after 365 days for non-moderators; editing prefills from the comment's `body`, which the server sends only to people who can edit it, so no revision fetch is needed.
- Tickets: every ticket route requires a session because the backend answers 401 to everyone signed out; the status filter offers all, open and closed (`open=1` and `open=0`), staff get the assignee inputs by the `can.*` flags, and new messages are announced through one polite live region instead of the whole list.
- Flatpages: a catch-all record placed before `not-found` renders static pages from the backend; 404 reuses the not-found content and 401 asks for a sign-in with the page as the redirect.
- Anonymous home: only the signed-out branch changes; the top performers show each school's short name, because the backend now sends the organization on every home user.
- Not in 8e: post editor, problem Discussion tab, organization edit and kick, user unban, staff ticket administration beyond the board, because no board or no backend exists for them.

### Known gaps

- Backend asks B-8e1 to B-8e4 are merged (`455fb44`, `1c7edc7`, `7c2977f`): comment body for editing, closed tickets in the list, organization `isOpen`, school short name on home users; no 8e screen waits for them.

## 8b auth screens

- `meta.layout: 'auth'` hides the shell's pill header only: theme and account-cache sync, the loading layer and `#main` keep running, so auth pages need no second shell.
- `/login` has no layout meta: it keeps the pill header and draws its own brand panel (the locale toggle is the shell header's, one per page); the other auth pages draw `AuthLayout`'s top bar.
- Card widths follow the boards: 460 px for state cards and 2FA, 480 for forced change, 520 for social signup, 660 for register (two columns from `sm`).
- On phones login follows the LoginPhone board: a band with Bit, logo and counts above a borderless form.
- Each page has one `h1` (the form or card title); the login brand headline is a styled paragraph.
- No "remember me" and no "or email" on login: `LoginDto` has neither, so the board's controls would send nothing.
- Login counts ("{problems} bài · {users} thành viên") come from `GET /home`: decoration only, no wait, empty on failure.
- Social buttons appear only on login (RegisterA has none) and are text-only, because lucide 1.0 has no brand icons.
- The school picker is a searchable PrimeVue `Select` ("Gõ để tìm trường"), 44 px tall (`min-h-11`), also on social signup, where the board drew a native select.
- The default-language select is native and starts at C++17 (`DEFAULT_LANGUAGE_KEY` is `CPP17`), as the board preselects; without that language it starts at "Chưa chọn".
- Both pickers are optional: ids are sent only when chosen (`chosenIds`), and their skeletons never hold the form (`registersWait: false`).
- Terms and privacy: the rules checkbox is plain text with no links and a client-side gate (`rulesMissing`), because the pages do not exist yet (5c) and the backend stores no consent.
- Username availability shows checking, free and taken as drawn; taken marks the input invalid but never blocks, and errors and a 429 show nothing.
- "Kiểm tra hộp thư" shows the address masked (`maskEmail`); resend cools down 60 s (`RESEND_COOLDOWN_SECONDS`).
- The wrong-email dead end ("Đăng ký lại") clears the name and shows that the name is held for 7 days (`ACTIVATION_DAYS`) until activation; no backend change stands behind the notice.
- `mail_unavailable` on register shows the "Đăng ký tạm thời không khả dụng" card instead of the form.
- Activation success lives at `/activate/done`, so a reload shows the success card and never posts the placeholder as a key; a dead key shows the "Liên kết đã hết hạn" card with the email form.
- An expired or used reset link replaces the token in the address with `/reset-password/expired`, so the token leaves history and a reload shows the dead-link card.
- Pages that take a link credential (`/activate/:key`, `/reset-password/:token`, `/register/social?token=`) call `useNoReferrer()`, so their requests carry no Referer; the social token leaves the address on mount.
- Guards never copy an activation key, a reset token or the social signup path into `?redirect` (`LINK_CREDENTIAL_ROUTES`).
- Social completion: `email_taken`, a linked identity (`conflict`) and a refused token each end in a terminal card, because the provider's address cannot change on this page.
- 2FA offers only the account's factors (B14); `methods: []` is the "Phiên đã thay đổi" card; sign-out sits in the top bar and under the card on every state.
- A WebAuthn prompt cancelled or timed out (`NotAllowedError`, `AbortError`) is not an error and sends nothing; the key button hides where `parseRequestOptionsFromJSON` is missing.
- The backup-code placeholder is 16 characters (`XXXX-XXXX-XXXX-XXXX`), the length of scratch codes, not the board's 8.
- Reset copy names no account and gives no validity period; the reset mail says 3 days.
- Password strength is a local estimate mirroring `passwordProblems`; the meter is `role="meter"` with the level in text; the backend decides and checks breached passwords.
- Field texts follow `issues[].code` (B10); the ban reason is `error.extra.banReason` (B8); `email.matches` is aliased to `email_invalid` until ask A1.
- A request answered `two_factor_required` or `password_change_required` reloads the session and re-runs the navigation rules (`onGateRequired`), because the route guard never saw that gate.
- Titles come from `meta.titleKey`; a page that swaps its form for a result card on the same path moves focus to `#main` (`focusMain`), as the router does on a path change.
- Backend asks left: A1 (`email_invalid` code), A2 (`open` filter), A3 (provider and email on social completion).
- E2E: `e2e/auth.e2e.ts` and `e2e/auth-accessibility.e2e.ts` run the flows and axe in every theme; `installAuth` in `e2e/fixtures/auth.ts` answers the scoped `GET /organizations`.

## Admin (plans 8f-1, 8f-2)

- **One shell**: `AdminShell` hosts every admin screen; the nav is the content canvas's five groups plus Cấu hình thô, Nhật ký thay đổi and Ngôn ngữ — user ruling, one shell.
- **Layout**: `meta.layout: 'admin'` makes AppShell render AdminShell instead of AppHeader — the board draws its own top bar; the auth pages keep theirs.
- **Permission gate**: `meta.permission` is a permission or any-of list; staff without it see AdminForbidden in place with the URL kept — existence of `/admin` is hidden from non-staff only.
- **Placeholder screens**: `/admin/types` renders AdminPlaceholder (it is drawn in the nav, has no board) — no invented visuals.
- **Problem and contest indexes**: open-by-key plus "Tạo …" links, reusing the Users exact-lookup pattern; the search card beside them is under "Admin indexes" below.
- **Bài nộp nav item**: links to the public `/submissions` list — no admin submission list was drawn; staff controls live on the submission page.
- **Problem editor tabs**: `/admin/problems/:code/{general,statements,editorial,data,files}` — shareable URLs, one job per page.
- **Live preview**: `POST /problems/render-preview` 500 ms after the last key, latest answer wins — the board's debounce; a static-page editor lacks problem permissions, hence `flatpage` source later.
- **Format config**: only fields in the backend registry — the board's extra fields do not exist in `libs/contests/src/formats`.
- **Contest read-back**: `pushAnnouncements` is a switch; access codes are hashed, so a blank box keeps the code and "Bỏ mã" removes it.
- **Contest user lists**: ids with `settings.users` naming them — chips show usernames, a short id only for a deleted account.
- **Similarity 429**: the countdown comes from `ApiError.retryAfterSeconds` — the backend sends Retry-After on every rate-limit refusal.
- **Similarity layout**: `/admin/similarity?contest=` lists runs and the summary below with `&run=` — the board shows list and summary on one screen.
- **Bulk rejudge count**: the confirm runs a `dryRun` on open and shows the count inside it, enabled only when allowed and above 0 (pick 1B, 2026-10-09), so a 403 stays the plain refusal.
- **Submission staff panel**: staff only, buttons follow `viewer.canRejudge/canReject/canAbort` — the server decides, the 409 stays as the stale-page fallback.
- **Downloads**: raw endpoints are plain `<a href>` to the API URL — they are not `{data}` envelopes.
- **One dialog**: every confirm uses `src/components/ConfirmDialog.vue`; specs drive it through `confirmDialog(label)`, e2e through `confirmInDialog(page, label)`; no second dialog implementation.
- **Superuser without the staff flag**: `/admin` stays not-found for them (the router checks `isStaff`), although every permission check passes superusers — existence of the area follows the staff flag, the screens follow the permissions.
- **Save bar per tab**: each editor tab has its own sticky "Lưu thay đổi" bar (the header belongs to the shared frame) — one save per tab, as "Mỗi tab lưu riêng".
- **Original description**: edited in the Statements tab as a third slot "Mô tả gốc" (PATCH `description`, locked for a full-markup problem without `judge.problem_full_markup`); board B points to Thông tin chung, which has no such field drawn.
- **Problem name**: the editor reads the base name from `editor.baseName` (the detail's own `name` follows `lang`) and PATCHes `name` only when edited.
- **No data version**: board C's "Phiên bản dữ liệu 7" is not shown; the API has no version (B-8f6).
- **Contest texts without preview**: contest description and announcements are plain Markdown boxes; `render-preview` needs problem permissions a contest editor may lack.
- **Ordering without drag**: contest problems and test cases move with labelled up/down buttons; the boards' drag handles are pointer-only.
- **Access codes**: hashed, so a blank box keeps the code and a "Bỏ mã" checkbox removes it (the board says "xóa trắng để bỏ mã"); `hasRankingAccessCode` and `requiresAccessCode` say whether one is set.
- **Create bodies**: a create sends no staff-only field (problem `STAFF_ONLY_FIELDS`, contest `GATED_CONTEST_FIELDS` incl. `rateAll`) unless the account holds its permission and the value was changed.
- **Admin indexes**: open-by-key stays and a URL-driven search card (`q`, `phase`, `page`) lists problems and contests beside it (pick 2B, 2026-10-09), its box shared with the users list; search is `q`, a case-insensitive substring of code or title (max 100).
- **Admin loading parity**: `e2e/admin-loading.e2e.ts` holds each screen's first request and checks the skeleton keeps the loaded box; skeleton heights fit a typical screen (one run, five users), so other row counts still move what follows.
- **Admin i18n**: per-area files under `src/i18n/admin/`, merged by `src/i18n/index.ts` — parallel tasks never conflict in one JSON.
- **Judge ping and key**: ping shows in ms (the API sends seconds); one `JudgeKeyDialog` serves "Tạo và lấy khoá" and a rotation (after a confirm that the judge disconnects), the key lives in component state only — the board says the key shows once.
- **Languages**: list from `GET /admin/languages`; judge coverage ("{judges} / {total}", "chỉ có trên một máy") joins `GET /judges` and shows only with `judge.change_judge`; create and edit are own pages with a sticky save bar, the key sealed on edit, PATCH sends changed fields only — no `GET /admin/languages/:id`, so edit finds the language in the list.
- **Users list**: exact lookup plus `GET /admin/users` with a username-prefix box (`?q=`), tabs Tất cả / Chưa cấm / Đã cấm (`?tab=`), ban reason and last access; a sort control (`?sort=`) orders by last access, oldest or newest first, else the server's order.
- **Impersonation**: "Đóng vai" only for superuser viewers, hidden for a superuser or banned target; `startImpersonation` and `session.startImpersonating` only, the bar and stop are 8h's `ImpersonationBanner` — one path.
- **Organizations**: list from `GET /organizations`, edit panel on the same page (`?org=`); staff-only fields (`isUnlisted`, `slots`, `shortName`) locked without `judge.edit_all_organization` and left out of a create body (closed, unlisted); search is a literal case-insensitive substring with the match marked; the tab "Yêu cầu tham gia · tất cả tổ chức" reads `GET /admin/organization-requests` and a decision goes through the request's own organization endpoint.
- **Blog moderation**: tabs all / global / "Đã ẩn" / "Hẹn giờ"; "Ẩn bài" and "Hiện lại" are `PATCH visible` after a confirm, "Hiện lại" warns when `publishOn` is ahead; no delete and no report queue (no model).
- **Site settings**: blocks follow the board; one "Lưu" PATCHes each changed key in order and stops at the first refusal; "Về mặc định" fills `Setting.default` and the user presses "Lưu"; an empty secret box keeps the stored secret, "Xoá bí mật" (red confirm) is the only way to empty one — a blank replace must never wipe a secret.
- **Revisions and restore**: "Lịch sử" is a side panel per key (20 per page), "Khôi phục" is `POST …/restore` and writes a new revision; a whole-secret key has no button (server 409); actors show as `shortId` (no name in the API).
- **Change log**: `/admin/log` lists revisions of one chosen setting key — no global audit read (B-8f2-3b).
- **Raw config**: read from `GET /site` with `cache: 'no-cache'`; writes patch the cached `/site`; HTML values preview in a sandboxed `srcdoc` iframe, never `v-html`; the analytics snippet is not checked by the backend (B-8f2-2).
- **Navigation bar**: tree from `GET /site` (orphans and cycles at top level as the backend does), edit in a dialog, parent select excludes self and descendants; a stored invalid regex shows "Regex lỗi".
- **Static pages**: the URL is canonicalised as the backend does (no trim, `/` and dot segments refused); live preview through `useRenderPreview(…, 'flatpage')`, a "Lịch sử" tab with line diff where "Nạp giá trị cũ" fills the form and the normal PATCH saves; "Trang đã xoá" lists `GET /admin/site/pages/deleted` and opens a deleted page's history read-only (`?deleted=<id>`); no recreate button.
- **Tickets queue**: reuses 8e's ticket queries, stream and components and its URL helpers; status Đang mở / Đã đóng / Tất cả is the server's `open` filter and the first visit writes `scope=all&open=1` once.
- **Activity**: `hasMore` pager (no total), filter in the URL, CSV export as a plain link with the same filter, live visitors refetch every 30 s (next page by `hasMore`), summary bars in SVG with a text table; deletes sit behind confirms.
- **Admin site loading parity**: `e2e/admin-site-loading.e2e.ts` covers judges (stats and rows, offset included), the first settings block and the activity table; skeleton heights are per breakpoint (`sm`) and fit a typical load (5 judges, 3 log rows), so other counts still move what follows.
- **Admin writes and reads**: shared admin writes live in `src/api/*-admin.api.ts`; reads shared with the public pages use 8e's API files — one query per data, no copy.

## Settings (8h)

- Settings keep flat routes and `/settings` stays the profile page: a `/settings → /settings/profile` redirect would rewrite the `redirect=` queries the guards and e2e pin.
- One frame (`SettingsLayout`) for all four sections, Appearance included: one `h1`, one breadcrumb, one section nav, so no section draws its own heading.
- Settings inputs reuse 8b's `AuthField` and `AuthSelect` (48 px, label above): one form language across auth and settings.
- No editor-colour and no maths-engine select: nothing in v2 reads `aceTheme` or `mathEngine`, so the controls would do nothing; the stored values are never sent.
- No display-badge select: the profile sends badge ids without names (backend ask A1); a later change adds it once names arrive.
- The UI language select applies at once and is device-only: it is a browser setting, so Undo and Save leave it alone.
- No "session expired, press Save again" banner: `client.ts` retries a `csrf_failed` once and an `unauthorized` answer signs out; keeping a draft across a sign-in would need persistence (YAGNI).
- Profile save is all or nothing, like the backend: a failed save keeps every change on the page and the summary names the fields to fix.
- Profile name and about counters follow validator's `isLength` (a surrogate pair counts 1), the rule the backend's `@MaxLength` applies.
- A 409 on organizations reloads the server's list and re-adds every organization it lists, with honest text: a retry must never drop an organization the viewer never saw.
- Organization admins cannot leave from settings (backend 409): their row shows "Quản trị viên" instead of the leave button.
- Security-key removal confirms in a dialog that asks for the current password (board D, not inline): the backend requires the password, and every destructive action confirms the same way.
- Data export shows no daily counter: the backend says only whether a request is allowed (`canPrepare`, `nextPrepareAt`), so a "3 / 3" chip would be invented.
- A 404 on the export status means "not available for this account" and is not retried.
- While an export is preparing the status polls every 5 s and stops once it is ready or empty: a finished job must not keep the page polling.
- Backup codes are shown grouped (`K7QM-2XRA-9PTD-4WLE`) and copied, downloaded and printed the same way: it is how people type them; every code field strips dashes and spaces (`normalizeBackupCode`) because the backend only upper-cases.
- Leaving the backup-code step before ticking "Tôi đã lưu…" asks first: the codes are never shown again.
- The one-time secrets (TOTP secret and QR, backup codes, API token) live only in component state, never in a cached query, store, URL or storage: a later visit must not show them.
- A 429 that names its wait shows "Thử lại sau N giây" on every auth-action form, because `authErrorText` owns it: the 2FA, backup-code, security-key and password forms (settings and the forced `/account/password` page). A 429 with no `Retry-After` shows the generic text.
- Notices reuse the verdict and accent tints (success AC, error WA, warning TLE, info accent-soft), as `AuthNotice` does; only the impersonation banner has new tokens (`caution-strong`), so it reads apart from the brand colour.
- Bit in settings: crown and sweat mark results only (save, backup codes shown, 2FA turned on, export ready or failed); the `security` padlock marks the security-page empties, the locked notices and the TOTP header, because a lock says "private", not "done".
- Sign out everywhere is locked while viewing as another user: it would end every session of the real user, and the backend refuses it too.
- The data page is locked while viewing as another user: export request and download are private data (`@NoImpersonation`, a backend task of 2026-10-09), so the page sends nothing.
- `PATCH /profile` stays allowed while viewing as another user: staff may fix a profile.
- One shared confirm dialog: `src/components/ConfirmDialog.vue` is extended (`canConfirm`, Enter submits, focus returns to the opener), not copied, so every confirm behaves the same.
- `uqr` 0.1.3 draws the TOTP QR in the browser: the secret must never reach a QR service, and a hand-written encoder is hundreds of lines.
- Backend ask still open: A1 (badge names on `/profile`). A2 (issue codes on `/profile`) shipped; the form still maps issues by field name.
- G1 and G2 are consumed as merged (`{ id, name }[]`, `{ remaining }`); the impersonation banner names the viewed account, not the staff member.

- **Backend refusals by code**: the SPA matches `error.issues[].code` (join-request `request_already_decided`/`organization_full`, `busy`, file refusals, taken keys/codes), never the English message; texts live in `admin.ui.issues.<code>`, unknown codes fall back to `failureTextOf`. Still on message or field shape because the backend sends no code: the blog official-contest lock 403, and the nav/flatpage/judge/language 409 `fields`. Refusal texts carry no file or extension name (codes have no params).
- **Impersonation**: "Đóng vai" also needs `staff.isActive`.
- **Release bot**: `changesets/action` (`.github/workflows/release.yml`) opens the Version Packages PR on every push to `main`; merging it runs `scripts/release/tag-release.mjs` (idempotent `v<version>` tag, no npm publish) because the app is private and the tag is the release.

## Replay and ghosts (VNOI F2)

- The freeze rule (`isBoardFrozen`) lives in `src/lib/board-freeze.ts`; the admin actions module re-exports it: the public replay needs it and must not import admin code.
- Refusal texts: `errorMessageKey` names a 403 `forbidden` by its first issue code when `errors.<code>` exists (`board_frozen`, `board_hidden`) and a 413 by its status (`payload_too_large`): the server's body-limit refusal has no stable code. Ghost CSV row codes are worded in `admin.ghosts.import.rowCodes.*`.
- The replay page shows real and ghost rows; the viewer's running virtual row appears only in the ranking page's "So với bảng thật" overlay: a virtual run has no replay events, only a live row at `now − realStart`.
- Replay ties: equal (score, cumtime, tiebreaker) share a rank (1, 1, 3); inside a tie real rows come first, then the virtual row, then ghosts; unranked ghosts are last with rank "—".
- All replay chunks load before the first board, every later chunk pinned to chunk 0's `buildId`; one restart on `409 replay_changed`, then the error.
- A `202 replay_building` is a success body, polled every 5 s while the page is open; 4xx answers are never retried (they are states: frozen, not ready, not ended, unsupported).
- `final_submission` shows "unsupported" without a request, and the "Phát lại" tab appears only after the end: the server answers 409 for both.
- A 403 on the replay reads its reason from `error.issues[0].code` (`board_frozen` frozen, `board_hidden` hidden); only without an issue does it fall back to the freeze rule (format freezes and the window is set). No unfreeze time is shown because the API does not know it.
- The player clock ticks every 250 ms and keeps running under reduced motion and low-power; only row movement stops.
- `?t=` holds whole seconds, written with `router.replace` on pause, end and a paused seek, never while playing; unreadable values mean 0, too large ones the end.
- The "Vừa xảy ra" feed is not a live region. A ghost event says "Ghost" once: the screen-reader prefix is added only when the ghost's label does not already contain the word.
- First solves on the scrub track count real rows only; ghosts never take a first-solve star.
- Ghost import always previews (`dryRun`) before replacing; replacing a non-empty set confirms with the current CSV download in the dialog; a new file or anonymise choice drops the preview.
- A refused ghost CSV lists one Vietnamese line per row from `issues[].code`/`issues[].row`; no English backend text is shown.
- Ghost and rebuild strings live in their own admin files (`admin.ghosts.*`, `admin.replay.*`); the replay rebuild is a fourth `ContestActionCard`.
- `cannot_edit_contest` (auto-publish outcome) already has vi and en lines in `admin.contestPublish.auto.reasons`.

## Contest extras (VNOI F3)

- Contest tag colours are theme tokens `tag-1`..`tag-8` (`--qh-tag-N` text, `--qh-tag-N-bg` tint) in every theme file, checked at 4.5:1 by `themes.spec.ts`; the backend stores only the key, so a theme change never touches data.
- Contest tags: an unknown `?tag=` is not sent (the list shows all contests with a notice); while the catalogue cannot be read the tag is sent as is and the row shows its notice; a slug without a catalogue entry is a neutral chip. `ContestChips` reads the catalogue from the cache only, so screens that do not need colours never fetch it.
- Rules acceptance: the dialog opens for registration, a first live join and every virtual join of a contest with non-blank rules; the code dialog follows the rules dialog when both are needed and both go in one request. A `rules_not_accepted` refusal reopens the dialog and re-reads the contest. The dialog is 520 px (M3A), through an optional `width` prop on `ConfirmDialog` (other callers keep the preset 448 px). `previousAcceptance` comes only from `viewer.liveParticipation`; virtual runs hide it.
- Contest problem limits are one "Giới hạn" column (M5B), `1 s · 256 MB`; a problem hidden from the viewer shows "—".
- Deviation from the plan, balloon 409s: `already_delivered` and `not_delivered` are told apart by `error.issues[].code`, not by status or message; both refetch the queue and show the row's real state.
- Deviation from the plan, publish: the card makes the editor run a dry run first and offers the real run only for the same `editorials` choice, because publishing has no undo; `contest_not_ended` and 429 map to text.
- Deviation from the plan, Data tab: the "Dữ liệu" tab owns the event-feed key and the submissions export (not the Actions tab). The minted key lives only in the reveal dialog and is forgotten when it closes; mint, revoke and release are not offered while impersonating; release is offered only for a frozen-until-release key during a freeze.
- Balloon screen: public-layout route with `requiresAuth` and no `staffOnly` (volunteers may be non-staff; the server answers 403/404); 10 s polling through vue-query's interval (paused in a background tab); the "next 10" sheet is its own route without the site header.
## VNOI ports: standalone (F5)

- `diff` 9.0.0 is pinned exactly (BSD-3-Clause, bundled types, no dependencies) for the submission source diff.
- Unit and e2e tests run as a strong device (8 cores, 8 GB) so low-power `auto` stays off unless a spec passes weak hints.
- The short-link button sits in the problem, contest, post, profile and organization headers for signed-in viewers; the profile and organization skeletons do not reserve its row (a signed-in header grows by one 44 px row when its data arrives, accepted), the problem and contest skeletons do.
- The not-found hint for short-link visitors needs a same-origin redirect on the first navigation, the router still on that path, and no completed navigation after the first (`trackFirstPage`); the footer clears the fixed contest action bar and submit dock through `--dock-height`.
- Two foundations (now for diff and low-power, after VNOI B8 for short links and integration clients), so features 11 and 19 do not wait for the backend.
- `diff` is imported only by `src/lib/line-diff.ts`, so it stays in the diff route's chunk.
- The diff page reads detail and source per side (four existing GETs, keyed by viewer): the source has no language, author or problem, which the header, the language notice and the named forbidden state need.
- Diff rows are pure (`lineDiff`): CRLF and a final newline normalised; whitespace-only changes flagged; moves are an unpaired removal and addition with the same trimmed text (blank lines excluded); above 5 000 lines a side is refused before diffing.
- Submission ids are typed or pasted as links (UUIDs, not M6C's numbers); list picks are two, in order, left then right; signed-out viewers get no pick boxes.
- Low-power: device-local `auto|on|off` in `qhhoj.lowPower`; `auto` is on for <= 2 GB memory, <= 2 cores or Save-Data, counting numbers only (`null <= 2` is true in JS).
- The contract is the `data-low-power` attribute on `<html>`, written only by `low-power.store.ts` and the pre-paint script; CSS and code read the attribute (`useLowPowerPainted`), never the store, because Bit is mounted without Pinia; F2's replay reads it too.
- Low-power turns off every animation and transition with one rule, blur 0 and blobs hidden above the theme files (`[data-theme]` in the selector), Bit at frame 0 (`useMotionOff`), the ranking poll to 60 s and the code editor to a textarea where Tab indents and Escape then Tab leaves.
- M10C's three cards sit on `/settings/appearance#low-power`; the popover has a compact three-way switch; a new footer shows the state and links there (no terms page exists, so no "Điều khoản" link).
- The short-link button is shown only to signed-in viewers, builds the raw canonical path itself, caches the code per viewer and path, and locks on the daily 429; on a phone it is full width except in the problem header, whose skeleton reserves its row for signed-in viewers.
- The not-found hint renders in `StatePanel` (notFound), `NotFoundPage` and `ContestNotFound`.
- `JudgeKeyDialog` wraps the new `admin/ui/RevealKeyDialog.vue`, which the integration screen reuses: one reveal-once behaviour.
- The integration screen locks create and revoke while impersonating; the backend refuses anyway (`@SessionOnly()`, `@NoImpersonation()`).

## VNOI ports: notifications, tickets, official mode (plan F1)

- The bell's drawer is PrimeVue `Drawer` (430 px, full screen under 640 px) styled by `pt` in `NotificationBell.vue`; focus goes back to the bell by hand because `Drawer` does not restore it.
- The drawer shows the first 5 rows of `GET /notifications?state=all&page=1` and reads them only when it opens; the page's first "all" page shares the key.
- `/notifications` filters by state and by kind chip through repeated `kind` query params (`kind=a&kind=b`); a client-side filter of one page would lie about emptiness. The "Khác" chip stays hidden until the backend adds `quota-warning` (`docs/api-mismatches/notifications.md` N1-01).
- Rows are grouped "Hôm nay" / "Trước đó" by the viewer's local day of `lastActivityAt`, because a merge moves a row to today.
- "Thông báo cũ" is client-side: a click probes `/tickets/{id}`, `/contests/{key}` or `/organizations/{slug}` from the row's path; 403/404 marks it read and relabels it, anything else navigates.
- One `/events/user` stream per signed-in public tab, owned by the bell; a burst of `notification` frames invalidates `['notifications', viewer]` once per second; a refused stream stays closed and the 60 s poll (also on window focus) carries on.
- Under impersonation the SPA sends no read or read-all request and says so once: the backend answers 204 and changes nothing.
- The badge shows `99+` above 99; the button's name carries the exact count; a polite region says "N thông báo mới" only when the count rises.
- The high-priority banner shows the newest unread `high` row on public layouts, with "Xem phiếu" (ticket kinds) or "Xem" and "Đánh dấu đã đọc".
- Official mode is read from a public `GET /site` query (`['site']`, stale 60 s) only for signed-in viewers; `officialMode: false` from `/site` wins over a cached `officialModeEndsAt`.
- The pill, banner and lock note read `SiteResponse.officialModeEndsAt` and fall back to plain copy when it is null.
- Locked controls: organization join, request and leave (`MembershipPanel`), organization order and leave in settings (`OrganizationsEditor`), plus one note on the profile card. Other surfaces (display badge, username override, comments, blog writes, votes) have no user UI yet and get the pattern when built.
- Name and about stay editable during official mode with a note on the card; a save is refused with `settings.profile.lockedOfficial`.
- A server `locked_in_official_contest` maps to the lock copy in `membership-errors.ts` and `profile-errors.ts`, because the `/site` cache can lag a minute.
- Superusers see the pill and the banner with an "exempt" line and no disabled control.
- The ticket thread renders `timeline` inside `TicketMessages.vue` (shared with the admin queue detail): runs of 2+ events fold into a `<details>` row, a lone event is a divider row. `marked-good`/`unmarked-good` rows are hidden when `can.markGood` is false; the cap notice shows at 200 stored events.
- A ticket PATCH refused with 409 `conflict` refetches the ticket and says it was reloaded (`ticket.conflictReloaded`), not "reload and try again".
- The canned picker shows for `can.assign` viewers; a pick appends to the draft; `{tên}` is the creator's username, `{bài}` the problem name, literal on a general ticket. The picker and the canned list share `['tickets', 'canned', viewer]`.
- Ticket summary alerts are one strip on `/tickets` and on the admin queue, polling 60 s.
- The canned-reply admin screen is `/admin/tickets/canned` (permission `judge.change_ticket`), reached from the ticket queue header.
- Admin settings now show `contest.officialModeEndsAt` (in the contest block) and `problem.deleteGraceDays` (new "Bài tập" group and block).
- The contest announcement "resend" button reads "Gửi lại cho những người chưa nhận được": the backend notifies only users the announcement has not reached.
- The shell's own reads answer from `SHELL_DEFAULTS` in `src/test/mock-api.ts` (unrecorded) and from `FakeApi` defaults in e2e.

## Problem lifecycle and organizations (VNOI F4)

- Deleted problems are a screen of their own, `/admin/problems/deleted`, shown as the "Đã xóa" tab of the Problems index (`judge.delete_problem`): `deleted` is a reserved code, so the static path never meets a problem.
- Delete and purge-now confirm with the typed problem code (`TypedCodeDialog`, exact match); restore has no confirm because it is reversible.
- The danger-zone card is the last card of the General tab; after a delete the editor opens the deleted list, since the problem's own page now answers 404.
- "Tải gói đề" POSTs once and then polls `GET` with a probe that cancels the body (the `probePdf` pattern); POST is the rate-limited call, so polling never repeats it. A ready package is a download link, not an automatic navigation: keyboard and screen readers reach it and pop-up blockers never interfere.
- A submission of a deleted problem shows the name with a "Đã xóa" chip and no link, and a tombstone notice in place of the cases: history stays, no test detail pretends to exist.
- The organization tabs "Bài tập" (members and admins) and "Hạn mức" (admins) are child routes of the organization layout and require sign-in; the API refuses everyone else. Problem filters live in the URL (`tag`, `archived`, `q`, `page`); a filter change returns to page 1.
- The org problem table's last column is "Cập nhật", read from `updatedAt` (formatted date); it replaces the "Điểm" column. The credit ledger has a "Người" column from `actorName`: a null actor renders a dash.
- `ContestTagColor` is renamed `TagColor` (`src/api/types/tag-color.ts`): the backend shares the token keys `tag-1`..`tag-8` between contest tags and organization problem tags, drawn through one chip map and one dot map (`org-tag-classes.ts`).
- Organization-problem write errors (tag and bulk) are matched by `error.issues[].code`, never by status or English text; the generic refusal text is the fallback.
- Quota meters: a meter exactly at its limit is blocked under enforce and near under warn, so a full organization is never called healthy and warn mode never claims a block.
- A quota edit sends only the changed fields; a null clears an override (site default). Unchanged boxes are not sent.
- `quota_exceeded` text is built once in `failureTextOf` from `ApiError.extra.details`, so every admin create, clone, upload and import form names the meter.
- The staff quota overview is `/admin/organizations/quotas` (`judge.edit_all_organization`); its editor reads the organization's usage for the current overrides, because overview rows carry resolved limits only.
- The archive-filter tabs show the total only on the active one (one request per filter); the archive notice asks `/problems/:code/archived-in` only for a signed-in viewer and a problem that lists an organization.
- The lifecycle screens (deleted list, danger zone, package download) were built without a mock-up, from the existing admin patterns; they need a mock-up round if the user wants a different look. M7A has no phone board either: org tables keep code, name and actions under 768 px, the bulk bar wraps, meters stack.
- An import (or any form) refusal whose issues name no field the form renders (`quota_exceeded` on `storage`) shows the code's text on the page line, as the F1 profile save does; quota fixtures carry the backend's `issues[]` plus `details`.
- Quota meter: a limit of 0 under enforce reads as blocked (used >= limit, or the server's `isOver`), whatever the near/over flags say.
- The deleted-problem tombstone Bit is decorative (no `bitLabel`); the unused `openEditor`, `columns.select` and `bitLabel` keys are removed.
- A bulk selection belongs to its page and organization; a list that loses the focused control moves focus to its container (`useFocusFallback`).
- Replay: any 4xx refusal on a refetch drops the loaded board (staff hid or re-froze it); only network and 5xx failures keep it. `replay_not_ready` polls 5 s doubling to 60 s and offers a retry.
- Replay: a gate answer (403, 404, 409) on a refetch drops the loaded board (staff hid or re-froze it); network, 5xx, 401 and 429 failures keep it, and a building replay keeps polling through them. `replay_not_ready` polls 5 s doubling to 60 s and offers a retry.
- Replay table: rows slide (FLIP) only up to 100 rows, since FLIP measures every row each tick; bigger boards jump. Row cells are memoised by the row's last applied event (`revision`), and the replay query is `shallow` so ticks read plain tuples.
