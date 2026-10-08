# QHHOJ frontend-v2

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

| To change                                | Look in                                             |
| ---------------------------------------- | --------------------------------------------------- |
| A colour, radius, blur or font           | `src/theme/themes/<id>.css`, `src/theme/tokens.css` |
| Add a theme                              | [CONTRIBUTING.md](CONTRIBUTING.md#add-a-theme)      |
| A utility name used by components        | `src/theme/styles.css` (`@theme inline`)            |
| PrimeVue component styling               | `src/theme/primevue-preset.ts`                      |
| A route or who may open it               | `src/router/routes.ts`, `src/router/guards.ts`      |
| A backend call or DTO                    | `src/api/<area>.api.ts`, `src/api/types/<area>.ts`  |
| A text                                   | `src/i18n/vi.json` and `src/i18n/en.json`           |
| Verdict colours and labels, rating tiers | `src/lib/verdicts.ts`, `src/lib/rating-tiers.ts`    |
| Ranking cell rules                       | `src/lib/ranking-cells.ts`                          |
| Live submission status                   | `src/api/use-submission-status.ts`                  |

## Auth screens

Routes: `/login`, `/login/2fa`, `/register`, `/register/social?token=`, `/activate` (resend), `/activate/:key` (`done` after success), `/forgot-password`, `/reset-password/:token` (`expired` after a dead link), `/account/password`. Each carries `meta.titleKey` (the document title). Every route but `/login` carries `meta.layout: 'auth'`: the shell draws no pill header and each page draws `AuthLayout`'s top bar. `/login` keeps the pill header and draws its own brand panel; its locale toggle is the shell header's.

| To change                                                        | Edit                                                                                                                                           |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Text of a backend refusal                                        | `errors.<code>` in `src/i18n/*.json`                                                                                                           |
| Text of a field refusal (`issues[].code`)                        | `auth.issues.<code>`; `issueText` in `src/features/auth/auth-errors.ts` falls back to the backend message                                      |
| Top bar, card, badge, field, button, banners                     | `AuthLayout`, `AuthBadge`, `AuthField`, `AuthSubmit`, `AuthError`, `AuthNotice` in `src/features/auth/`                                        |
| What a form does around its request (pending, error text, focus) | `use-auth-action.ts`                                                                                                                           |
| Where a sign-in ends                                             | `use-after-sign-in.ts` (always through `safeRedirect`)                                                                                         |
| What a guard copies into `?redirect`                             | `src/router/guards.ts` (`LINK_CREDENTIAL_PATH`: activation, reset and social signup paths are never copied)                                    |
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

## More

- [CONTRIBUTING.md](CONTRIBUTING.md): conventions, styling and theme rules, testing
- [docs/decisions.md](docs/decisions.md): design decisions, backend asks and known gaps
