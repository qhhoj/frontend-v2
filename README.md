# QHHOJ frontend-v2

[![API drift](https://github.com/qhhoj/frontend-v2/actions/workflows/api-drift.yml/badge.svg)](https://github.com/qhhoj/frontend-v2/actions/workflows/api-drift.yml)

Vue 3 SPA of the QHHOJ online judge, served against `backend-v2` (`/api/internal`).

## Requirements

- Node 22.13+
- backend-v2 on `http://localhost:3000` with `SITE_URL=http://localhost:5173` and `COOKIE_SECURE=false` (see `backend-v2/.env.example`)
- Open the app at exactly `http://localhost:5173`: the backend's Origin check compares with `SITE_URL`, so `127.0.0.1` fails every POST with `csrf_failed`

## Setup and run

```
npm ci
npm run dev                          # http://localhost:5173, proxies /api to API_ORIGIN
API_ORIGIN=http://localhost:3001 npm run dev
```

`API_ORIGIN` defaults to `http://localhost:3000`.

- `npm run api:gen` copies `../backend-v2/openapi.json` (or `OPENAPI_SPEC=/path/to/openapi.json`) to `src/api/generated/openapi.json`, records the backend commit in `openapi.source` and regenerates `schema.d.ts`; commit all three. `npm run api:check` (CI) fails when they disagree; `npm run api:check -- --backend` also fails when the snapshot lags the backend checkout.

| Command             | Purpose                                                                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`       | dev server on :5173                                                                                                                                      |
| `npm run build`     | typecheck (`vue-tsc --build`) and production build to `dist/`                                                                                            |
| `npm run preview`   | serve `dist/` on :4173                                                                                                                                   |
| `npm test`          | Vitest: unit and component specs                                                                                                                         |
| `npm run e2e`       | Playwright on :4310 (`E2E_PORT` for parallel runs): builds `dist/`, previews it and answers the API with a fake (`npx playwright install chromium` once) |
| `npm run lint`      | ESLint, `prettier --check`, `lint:tokens` (no colour literals outside themes)                                                                            |
| `npm run typecheck` | `vue-tsc --build`                                                                                                                                        |
| `npm run check`     | lint, typecheck, test                                                                                                                                    |

## Architecture

```
src/
  main.ts, app-plugins.ts   bootstrap (Pinia, router, i18n, vue-query, PrimeVue unstyled)
  router/                   route table, guards (session, 2FA, password change, staff), safe redirects
  api/                      fetch client, SSE, DTO types, one <area>.api.ts per backend area
  stores/                   Pinia: session, locale (the theme store lives in theme/)
  theme/                    tokens, one CSS file per theme, registry, theme store, PrimeVue preset
  i18n/                     vi.json (default), en.json
  lib/                      pure helpers (verdicts, rating tiers, formats, ranking cells)
  components/               shared UI
  features/<area>/          pages, their parts, <area>.queries.ts
  features/shell/           app shell, theme menu, account sync
  test/                     Vitest setup, mount and API mocks, fixtures (shared with e2e)
e2e/                        Playwright specs and the fake API (e2e/fixtures/api.ts)
scripts/check-tokens.mjs    lint:tokens
design-system/qhhoj/        design notes (Clay & ivory default, Glass optional)
```

Data flow: page -> `features/<area>/<area>.queries.ts` (vue-query) -> `api/<area>.api.ts` -> `api/client.ts`. Client state (session, theme, locale) is Pinia; server state is vue-query only.

## Where to change what

| To change                                                    | Look in                                                                                                                                                                                  |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A colour, radius, blur or font                               | `src/theme/themes/<id>.css`, `src/theme/tokens.css`                                                                                                                                      |
| Add a theme                                                  | [CONTRIBUTING.md](CONTRIBUTING.md#add-a-theme)                                                                                                                                           |
| A utility name used by components                            | `src/theme/styles.css` (`@theme inline`)                                                                                                                                                 |
| PrimeVue component styling                                   | `src/theme/primevue-preset.ts`                                                                                                                                                           |
| A route or who may open it                                   | `src/router/routes.ts`, `src/router/guards.ts`                                                                                                                                           |
| A backend call or DTO type                                   | `src/api/<area>.api.ts` (typed by route through `src/api/typed.ts`); `src/api/types/<area>.ts` are aliases of `src/api/generated/schema.d.ts`; after a backend change: `npm run api:gen` |
| A text                                                       | `src/i18n/vi.json` and `src/i18n/en.json`                                                                                                                                                |
| Verdict colours and labels, rating tiers                     | `src/lib/verdicts.ts`, `src/lib/rating-tiers.ts`                                                                                                                                         |
| Ranking cell rules                                           | `src/lib/ranking-cells.ts`                                                                                                                                                               |
| Replay board rules (order, ties, ghosts, first solves, feed) | `src/features/contests/replay/replay-board.ts`, `replay-timeline.ts`                                                                                                                     |
| Replay states and the Bit each one shows                     | `src/features/contests/replay/replay-state.ts`, `replay-bits.ts`                                                                                                                         |
| Ghost import, preview and delete (staff)                     | `src/features/admin/contests/ghosts/`                                                                                                                                                    |
| Live submission status                                       | `src/api/use-submission-status.ts`                                                                                                                                                       |
| Source diff rules (rows, moves, folds, the 5 000-line limit) | `src/lib/line-diff.ts`; page states in `src/features/submissions/diff-state.ts`                                                                                                          |
| Low-power mode (thresholds, what it turns off)               | `src/theme/low-power.ts`, `src/theme/low-power.store.ts`, the `:root[data-low-power]` block in `src/theme/styles.css`, `index.html` pre-paint                                            |
| Short-link button and its paths                              | `src/features/short-links/`                                                                                                                                                              |
| Settings sections, the frame and its nav                     | `src/features/account/settings/SettingsLayout.vue` (`SECTIONS`)                                                                                                                          |
| Profile form rules (what is sent, length limits, after-save) | `src/features/account/profile/profile-draft.ts`; save sequence shared with theme/look in `src/features/account/use-profile-save.ts`                                                      |
| Security actions                                             | one component each in `src/features/account/security/`; destructive ones confirm in `ConfirmDialog`                                                                                      |
| Data export states and polling                               | `src/features/account/data/data-export.ts`                                                                                                                                               |
| Bit in settings                                              | `SettingsNotice`'s `bit` prop, `EmptyState`'s `kind` and `InlineBit` (one word per placement)                                                                                            |
| Contest tag colours                                          | `src/theme/themes/<id>.css` (`--qh-tag-1..8`, `-bg`), classes in `src/features/contests/tag-colors.ts`                                                                                   |
| Contest tag filter and chips                                 | `src/features/contests/tag-chips.ts`, `ContestTagFilter.vue`; catalogue admin in `src/features/admin/contest-tags/`                                                                      |
| Which joins ask for the contest rules                        | `src/features/contests/join-rules.ts`                                                                                                                                                    |
| Balloon queue, print sheet                                   | `src/features/contests/balloons/`                                                                                                                                                        |
| Publish card, Data tab (export, feed key)                    | `src/features/admin/contests/actions/ContestPublishCard.vue`, `src/features/admin/contests/data/`                                                                                        |
| Bit on the contest extras screens                            | `src/features/contests/contest-extras-bits.ts`                                                                                                                                           |
| Notifications: bell, drawer, page, banner, live stream       | `src/features/notifications/` (`notifications.queries.ts` keys, `use-notification-stream.ts`, `notification-target.ts` for "Thông báo cũ")                                               |
| Official mode: pill, banner, locked controls                 | `src/features/official-mode/` (`useOfficialMode`, `useOfficialLock`, `OfficialLockNote`)                                                                                                 |
| Ticket timeline rows and folding                             | `src/features/tickets/ticket-thread.ts`, `TicketMessages.vue`                                                                                                                            |
| Canned replies: placeholders and picker                      | `src/features/tickets/canned/`                                                                                                                                                           |
| Bit in notifications, official mode and tickets              | `NOTIFICATION_BITS` (`notification-bits.ts`), `TICKET_BITS` (`ticket-bits.ts`)                                                                                                           |

## Auth screens

Routes: `/login`, `/login/2fa`, `/register`, `/register/social?token=`, `/activate` (resend), `/activate/:key` (`done` after success), `/forgot-password`, `/reset-password/:token` (`expired` after a dead link), `/account/password` (only the forced change after a breach; the voluntary one is in the security settings). Each carries `meta.titleKey` (the document title). Every route but `/login` carries `meta.layout: 'auth'`: the shell draws no pill header and each page draws `AuthLayout`'s top bar. `/login` keeps the pill header and draws its own brand panel; its locale toggle is the shell header's.

| To change                                                        | Edit                                                                                                                                           |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Text of a backend refusal                                        | `errors.<code>` in `src/i18n/*.json`                                                                                                           |
| Text of a field refusal (`issues[].code`)                        | `auth.issues.<code>`; `issueText` in `src/features/auth/auth-errors.ts` falls back to the backend message                                      |
| Top bar, card, badge, field, button, banners                     | `AuthLayout`, `AuthBadge`, `AuthField`, `AuthSubmit`, `AuthError`, `AuthNotice` in `src/features/auth/`                                        |
| What a form does around its request (pending, error text, focus) | `use-auth-action.ts`                                                                                                                           |
| Where a sign-in ends                                             | `use-after-sign-in.ts` (always through `safeRedirect`)                                                                                         |
| What a guard copies into `?redirect`                             | `src/router/guards.ts` (`LINK_CREDENTIAL_ROUTES`: activation, reset and social signup paths are never copied)                                  |
| Default sign-up language                                         | `DEFAULT_LANGUAGE_KEY` in `signup-choices.ts` (`CPP17`; without it the picker starts at "Chưa chọn")                                           |
| Password strength                                                | `src/lib/password-strength.ts` (mirrors the backend's `password-policy.ts`; the backend decides and checks breached passwords)                 |
| Username check                                                   | `use-username-availability.ts` (`GET /auth/username-available`; a hint, never a gate)                                                          |
| School and default-language pickers                              | `SignupChoices.vue` (`SchoolPicker`, `AuthSelect`), shared by register and social signup                                                       |
| Terms and privacy line                                           | `auth.rules` in `src/i18n/*.json`; plain text, no links, until the pages exist (5c)                                                            |
| "Email me a link" and "Kiểm tra hộp thư"                         | `EmailLinkRequest.vue`, `InboxNotice.vue`, cooldown in `use-cooldown.ts`                                                                       |
| Which second-factor card shows                                   | `two-factor-view.ts`                                                                                                                           |
| Social buttons                                                   | the list comes from `GET /auth/social/providers`; `social-providers.ts` knows their labels                                                     |
| Pages with a credential in the address                           | call `useNoReferrer()`; for a credential in the path, add the route to `CREDENTIAL_ROUTES` in `backend-v2/libs/community/src/user-activity.ts` |
| Query parameters the login screen reads                          | `redirect` (a safe in-app path), `error` (OAuth callback codes), `notice` (`password-reset`)                                                   |
| Auth e2e                                                         | `e2e/auth.e2e.ts`, `e2e/auth-accessibility.e2e.ts`; `installAuth` and its scoped `GET /organizations` in `e2e/fixtures/auth.ts`                |

## Admin

Admin screens live in `src/features/admin/<area>/` (one folder per area: problems, contests, users, similarity, rejudge, search, ...), inside the shared `AdminShell`. `ADMIN_SCREENS` in `src/features/admin/admin-screens.ts` lists every screen once (id, path, permission); `admin-routes.ts` turns it into routes and maps each id to its page in `SCREEN_COMPONENTS`. Texts are per area in `src/i18n/admin/<area>.vi.json` and `.en.json`, merged by `src/i18n/index.ts`. Fixtures for specs and e2e are in `src/test/admin-fixtures/`, e2e helpers (`signInAsStaff`, `adminOk`, `adminList`, `confirmInDialog`) in `e2e/fixtures/admin.ts`. Which Bit mascot each admin placement shows is decided in one place, `ADMIN-BIT-HOOK` in `src/features/admin/shell/admin-bit.ts`.

The site screens (plan 8f-2) are judges, languages, users, organizations, blog moderation, site settings, raw config, static pages, the staff ticket queue, user activity and the change log, one folder each in `src/features/admin/`. Shared admin writes live in `src/api/*-admin.api.ts`; reads shared with the public pages (organizations, posts, tickets, `GET /site`) come from the community API files. Loading parity for the site screens is in `e2e/admin-site-loading.e2e.ts`. The canned ticket replies screen (`/admin/tickets/canned`, `src/features/admin/canned-replies/`) is reached from the ticket queue's header.

Plan F5 adds two site screens: short links (`src/features/admin/short-links/`, `judge.manage_short_link`) and external systems (`src/features/admin/integrations/`, `judge.manage_integration`, session-only, key shown once through `admin/ui/RevealKeyDialog.vue`).

Plan VNOI F4 adds `problems/lifecycle/` (the "Đã xóa" tab and the danger-zone delete), `problems/package/` (the full package download on the Data tab) and `organizations/quotas/` (the staff quota overview) under `src/features/admin/`; the public organization tabs "Bài tập" and "Hạn mức" live in `src/features/organizations/problems/` and `src/features/organizations/quota/`, their Bit placements in `src/features/organizations/org-bits.ts`.

To add a screen: add its entry to `ADMIN_SCREENS`, add one `SCREEN_COMPONENTS` line for it, add `admin.shell.screens.<id>` (nav title) and the area's i18n files, put the nav item in `shell/admin-nav.ts` if it has one, and add a skeleton with a `data-skeleton-region` sized to the loaded content plus a case in `e2e/admin-loading.e2e.ts` (or `e2e/admin-site-loading.e2e.ts` for a site screen).

## More

- [CONTRIBUTING.md](CONTRIBUTING.md): conventions, styling and theme rules, testing
- [docs/decisions.md](docs/decisions.md): design decisions, backend asks and known gaps
