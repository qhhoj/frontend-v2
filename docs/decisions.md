# Design decisions

What the code does and why. Conventions are in [CONTRIBUTING.md](../CONTRIBUTING.md); the spec is `docs/superpowers/specs/2026-10-08-frontend-design.md` (local, not committed).

## Stack and tooling

- Vue 3, Vite, TypeScript, Pinia, vue-query, vue-i18n, Tailwind 4, PrimeVue unstyled, Lucide — the SPA stack in the spec.
- PrimeVue 4.5.5 (MIT), not 5 — PrimeVue 5 ships under the PrimeUI commercial licence and needs a key.
- TypeScript 5.9, not 7 — typescript-eslint 8 supports `<6.1`; openapi-typescript 7 needs `^5`.
- `engines.node >= 22.13`, jsdom 29.0.0 — jsdom 30 needs Node 22.22.2+ (or 24.15+) and the dev machine runs 22.22.1.
- No `composite` in the tsconfigs — with it the e2e import of `src/test/fixtures.ts` fails with TS6307.
- Playwright on port 4310, not vite's 4173 — a developer's own `vite preview` may hold 4173.
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
- A 401 on a protected request signs the viewer out in the store — otherwise an expired session leaves the shell signed in while every request fails; a page-level redirect comes in 8b.
- Profile query runs only when authenticated with no password change pending — the guard answers every other request with 403 `password_change_required`.
- Account-owned queries keep the user id in their key and the cache is cleared in one place (`useAccountCacheSync`) whenever the signed-in user changes (login, logout, expiry, another account) — the next viewer must never see the previous account's data.
- `redirect` values pass through `safeRedirect`: only `/path`; `//`, `/\`, scheme URLs and arrays become `/` — open-redirect protection.
- Non-staff on `/admin/**` get not-found at the same URL — existence is not revealed. Admin is one lazy chunk.
- Guards route page navigations only; `csrf_failed`, `two_factor_required` and `password_change_required` from an API call are not turned into redirects (8b). Their messages exist in both locales.
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
- The theme menu lists the six preferences grouped by style (Clay, then Glass; each style's themes, then its automatic option); a Style × Mode control is left to the appearance panel (8g).
- Clay mock-up values adjusted by measurement: link and focus ring `#B4532F` to `#A64A28`, AC/positive `#15803D` to `#166534`, `tier-master` `#B45309` to `#9A3412`, `accent-2` `#D97757` to `#9A3F22`, dark button text charcoal `#1A1816` instead of white — never by loosening the spec.
- Syntax tokens (`--qh-syntax-*`) live in the four theme files since this change (8c reuses them); Glass values moved: dark comment `#C4B9E0`, light number `#7C5200`, light function `#09617F`.
- Clay's first-solve tint is gold/amber (Bit's accent family) with the star kept, so it reads apart from the red wrong-answer tint; `themes.spec.ts` checks the hue gap and 4.5:1 text. The ranking legend names no colour: a swatch and the star.
- Hairlines stay decorative (`#E8E2D8` is 1.2:1 on ivory, like Glass's 10 % white): inputs and inner tiles are told apart by `surface-strong`, not by their border; menus, Select and popovers use `line-strong` so they separate from white cards.
- Theme preference resolves through the registry: `auto`, `glass-auto`, a stored value or a theme id; an unknown value falls back to the Clay theme of the OS scheme — legacy and backend values always render; the legacy `light`/`dark` resolve to Clay.
- `choose()` is a user action: it applies the theme and remembers it in this browser; signed in, the menu also saves it as `siteTheme`, and a failed save keeps the local choice — the account is the cross-device truth.
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
- A banned login shows the generic ban message; the reason waits for B8 (structured `banReason`).
- Unknown backend codes show `errors.generic`.

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
| B8 | Login ban error carries a structured `banReason` (the frontend parses `Reason:` text today) | ban reason on login |
| B9 | Distinct error codes for the per-user rate limit, the unfinished-submission limit, a problem ban and a contest submission cap | precise submit messages |

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

## Known gaps (later sub-projects)

- Reloading `/activate/done` shows the invalid-link page — 8b polish.
- Session expiry mid-page redirects on the next navigation only — 8b.
- Contest screens beyond ranking — 8d; admin screens — sub-project 7.
