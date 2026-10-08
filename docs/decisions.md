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
- DTO types are hand-written until the backend OpenAPI carries response schemas (backend ask B1) — the plugin reads only `*.dto.ts` today.
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
| B1 | OpenAPI response schemas (`dtoFileNameSuffix` including `.response.ts`, fix circular refs, paginated response helper) | generated DTO types |
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
- Guards never copy an activation key, a reset token or the social signup path into `?redirect` (`LINK_CREDENTIAL_PATH`).
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
- **Problem and contest indexes**: open by code or key plus "Tạo …" links, reusing the Users exact-lookup pattern — flagged for a mock-up round.
- **Bài nộp nav item**: links to the public `/submissions` list — no admin submission list was drawn; staff controls live on the submission page.
- **Problem editor tabs**: `/admin/problems/:code/{general,statements,editorial,data,files}` — shareable URLs, one job per page.
- **Live preview**: `POST /problems/render-preview` 500 ms after the last key, latest answer wins — the board's debounce; a static-page editor lacks problem permissions, hence `flatpage` source later.
- **Format config**: only fields in the backend registry — the board's extra fields do not exist in `libs/contests/src/formats`.
- **Contest read-back**: `pushAnnouncements` is a switch; access codes are hashed, so a blank box keeps the code and "Bỏ mã" removes it.
- **Contest user lists**: ids with `settings.users` naming them — chips show usernames, a short id only for a deleted account.
- **Similarity 429**: the countdown comes from `ApiError.retryAfterSeconds` — the backend sends Retry-After on every rate-limit refusal.
- **Similarity layout**: `/admin/similarity?contest=` lists runs and the summary below with `&run=` — the board shows list and summary on one screen.
- **Bulk rejudge**: no count before confirm — a pre-confirm count is a new visual; after a 403 a dry run words the refusal by `allowed`.
- **Submission staff panel**: staff only, buttons follow `viewer.canRejudge/canReject/canAbort` — the server decides, the 409 stays as the stale-page fallback.
- **Downloads**: raw endpoints are plain `<a href>` to the API URL — they are not `{data}` envelopes.
- **Confirm dialogs**: one shared `ConfirmDialog.vue`, driven in specs and e2e by its confirm button's label — no second dialog implementation.
- **Superuser without the staff flag**: `/admin` stays not-found for them (the router checks `isStaff`), although every permission check passes superusers — existence of the area follows the staff flag, the screens follow the permissions.
- **Admin i18n**: per-area files under `src/i18n/admin/`, merged by `src/i18n/index.ts` — parallel tasks never conflict in one JSON.
