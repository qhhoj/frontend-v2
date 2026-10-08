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

- Pinia holds client state only: `session`, `theme`, `locale`. Server data is never copied into Pinia
- vue-query keys: `[area, resource, params]` (`['problems', 'list', filters, lang]`); invalidate by prefix (`['submissions']`)
- Account-owned queries include the user id in the key (`profileKey(userId)`); signing out or an expired session clears the cache (`useAccountCacheSync`)
- Lists and polls keep the previous data while a new key loads (`keepPreviousData`, `placeholderData`), so a filter change or a failed poll does not blank the screen
- API calls go through `apiRequest` (single value) or `apiPage` (list) in `src/api/client.ts`; it sends `X-CSRF-Token` on unsafe methods, unwraps the envelope and throws `ApiError { code, status, fields }`
- DTO types are hand-written in `src/api/types/<area>.ts` with a `backend:` pointer to the response class, until the backend OpenAPI carries response schemas; then they are generated
- Error text: `$t(errorMessageKey(error))`; add a message to `errors.<code>` in both locale files for a new backend code
- Realtime: `openEventStream` (`src/api/events.ts`); follow a submission with `useSubmissionStatus`
- Redirects from the URL (`?redirect=`) pass through `safeRedirect` (`src/router/safe-redirect.ts`) before any navigation

## Styling

- Components use the semantic utilities from `src/theme/styles.css` only (`bg-surface`, `text-content`, `text-muted`, `border-line`, `rounded-card`, `font-display`, ...). Tailwind's own palette, fonts and radii are removed
- No colour literals outside `src/theme/themes/*.css` (specs excepted): `npm run lint:tokens` fails on them
- Classes picked at runtime come from a static `Record<..., string>` map (Tailwind must see the full class names)
- Glass card: `GlassCard`; user-written HTML (posts, comments, about pages) goes in `UserContent`, which contains it (see decisions)
- Overlays (menus, popovers) are opaque `bg-surface-solid`
- PrimeVue is unstyled; its look lives in `src/theme/primevue-preset.ts` with the same utilities
- Screens are built only from an approved mock-up; others get logic and plain placeholder markup

## Add a theme

1. Copy `src/theme/themes/glass-dark.css` to `src/theme/themes/<id>.css`. Keep only `:root[data-theme='<id>']` as the selector (drop the `:root,` base that glass-dark carries) and change the values (6-digit hex or `rgba()` only)
2. Import it in `src/theme/styles.css` next to the others
3. Add `{ id: '<id>', labelKey: 'theme.<key>', scheme: 'dark' | 'light', storedAs: '<id>' }` to `THEMES` in `src/theme/registry.ts`, and the label to both locale files
4. If the theme should become the default for its scheme, replace the fallback id in the pre-paint script in `index.html` (`known` and the `prefersLight` branch); the `known` list must contain every registered id, and `src/theme/prepaint.spec.ts` enforces that
5. `npm test`: `src/theme/themes.spec.ts` fails on a missing token, a CSS file that is not registered (or the reverse), a missing import in `styles.css`, the wrong `color-scheme`, or any text pair under 4.5:1 on the worst ground (blob centre + glass + hover, and the opaque fallback)
6. Backend: the account's `siteTheme` accepts only `auto | light | dark` today; allow the new id there (backend ask B3) before the theme can be saved per account. Until then, `storedAs` maps the theme onto a backend value

Change a palette: edit the values in the theme file and run `npm test`.

## Accessibility

- Text 4.5:1 on every ground, checked per theme by `themes.spec.ts` and by axe in e2e
- Never remove the focus ring; real `<button>`/`<a>`; `aria-label` on icon-only buttons; icons `aria-hidden="true"`
- Meaning never by colour alone: verdicts carry their code and a spoken label; ranking cells `+n`/`−n`/`?n` plus a label
- Touch targets at least 44 px (`min-h-11`, `size-11`); wide tables scroll inside their card
- `prefers-reduced-motion` and `prefers-reduced-transparency` are handled in the token layer; do not add motion that bypasses `--qh-duration`

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
- E2E runs with `reducedMotion: 'reduce'`; wait for a visible element that only exists once the data has loaded, not for `networkidle`
- Playwright never kills processes by name; stop only the servers you started

## Commits

- One-line conventional subject: `feat: ...`, `fix: ...`, `test: ...`, `docs: ...`, `refactor: ...`, `chore: ...`
