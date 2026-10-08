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
- Every existing account carries `siteTheme: 'light'` (schema default) — so the account theme must not overwrite a browser's own choice on sign-in (see Theme).

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
- Theme preference resolves through the registry: `auto`, a stored value or a theme id; an unknown or retired value falls back to the OS scheme — legacy and backend values always render.
- `choose()` is a user action: it applies the theme and remembers it in this browser; signed in, the menu also saves it as `siteTheme`, and a failed save keeps the local choice — the account is the cross-device truth.
- `adopt()` applies the account's theme without writing the browser preference — the account default must not overwrite the browser's own choice on each sign-in; `adopt(null)` on sign-out returns to the browser choice, then the OS.
- A cached theme id is held at start-up until the account or the OS says otherwise — no repaint of the theme already on screen.
- The pre-paint script in `index.html` applies the last painted theme id (`qhhoj.resolvedTheme`) — no flash of the wrong theme. It repeats the registry ids and each theme's ground (address-bar colour); `prepaint.spec.ts` enforces that they match.
- Reduced transparency or no `backdrop-filter`: blur 0 and opaque surfaces; reduced motion: durations 0 — glass stays readable.
- Background blobs: phones get two 300 px blobs; blob-3 is hidden below 768 px wide or at 759 px high and under — on narrow or short screens its centre would sink into blob-2 and break contrast.

## User content

- `UserContent` containment is load-bearing: `overflow: clip; contain: paint inline-size; isolation: isolate; min-width: 0`, with pre, `.katex-display` and tables scrolling inside the box — sanitized user HTML cannot paint, size or stack outside its box.
- The backend sanitizer must keep blocking the `popover` attribute — a popover opens in the top layer and escapes the containment.
- `v-html` only in `UserContent`; no 8a route renders it yet. Other backend strings are rendered as text.

## Screens and mock-up deviations

- Screens without an approved mock-up ship as logic plus plain placeholder markup — visuals come from mock-up rounds.
- Home: "Top rating" (top 3 by rating) replaces "Top tuần" — there is no weekly board (B7).
- Home: the rating delta is the change at the last rated contest — ratings move per contest.
- Home: quick submit is a problem code, a language select and a plain monospace textarea — Monaco comes with 8c. Its status region is `aria-live="polite"`, which re-announces each test-case frame (up to 4 per second).
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

- `rate_limited` covers both the per-user rate and the unfinished-submission limit; `forbidden` covers a problem ban and a contest cap — distinct messages wait for B9.
- A banned login shows the generic ban message; the reason waits for B8 (structured `banReason`).
- Unknown backend codes show `errors.generic`.

## Backend asks

| # | Ask | Unblocks |
|---|---|---|
| B1 | OpenAPI response schemas (`dtoFileNameSuffix` including `.response.ts`, fix circular refs, paginated response helper) | generated DTO types |
| B2 | `siteTheme` (and `languageId`) on `GET /auth/me` | one request fewer at boot |
| B3 | `siteTheme` default `auto` for new users; accept registered theme ids when a third theme exists | theme preference, new themes |
| B4 | `ranking` event on `contest-events` after a participation recompute | live ranking without polling |
| B5 | `rating` and first organization short name on ranking row users | tier colours, captions |
| B6 | `solved=false` filter on `GET /problems` | "Chưa giải" chip |
| B7 | Weekly top users, or drop the idea | home "Top tuần" |
| B8 | Login ban error carries a structured `banReason` (the frontend parses `Reason:` text today) | ban reason on login |
| B9 | Distinct error codes for the per-user rate limit, the unfinished-submission limit, a problem ban and a contest submission cap | precise submit messages |

## Known gaps (later sub-projects)

- Reloading `/activate/done` shows the invalid-link page — 8b polish.
- Session expiry mid-page redirects on the next navigation only — 8b.
- Real-backend e2e and the submission screens — 8c.
- Contest screens beyond ranking — 8d; admin screens — sub-project 7.
