# Clay — QHHOJ design language

Clay is the design language of frontend-v2. Clay & ivory is the default theme; Glass is an optional theme family. Theme intent and colour roles: `design-system/qhhoj/MASTER.md`. Values live in code: `src/theme/tokens.css`, the `@theme` blocks in `src/theme/styles.css`, `src/theme/themes/*.css`.

Root problem it fixes: the same control was built four ways (admin `controls.ts`, `settings/buttons.ts` + `AuthField`, hand-spelled public classes, dialog copies). Rule: named tokens only, one primitive kit, density by scope.

## Tokens

| Group | Names |
|---|---|
| Type (font size only) | `text-tiny` 11 · `text-caption` 12 · `text-meta` 13 · `text-sm` 14 · `text-base` 16 · `text-title` 17 · `text-subtitle` 18 · `text-section` 20 · `text-display` 24 · `text-page` 26 · `text-stat` 26 (+ `font-mono`) · `text-hero` 40 · `text-score` 56 (submission score) |
| Leading | tiny/caption 16 px · meta 18 · sm 20 · base 24 · title 22 · subtitle/section/display set none (add a `leading-*`) · page 1.25 · stat/hero/score 1 |
| Control height | `--qh-control` 44 (md) · `--qh-control-sm` 36, 44 on coarse pointers · `--qh-control-lg` 56 (swap card submit) |
| Radius by role | `rounded-control` (`--qh-radius-control`: pill; 12 in admin) · inputs, code `rounded-cell` 12 · inset tiles, notices `rounded-row` 16 · cards, dialogs `rounded-card` 24 · chips, tabs, segmented `rounded-pill`. menus, popovers `rounded-row`. `tile` 20 and `panel` 28 no longer exist: lint-banned, tokens removed |
| Control border | `border-line-control` (`--qh-line-control`): the border of inputs, selects, textareas and secondary buttons, at least 3:1 on the ground, the card and the inner tile (WCAG 1.4.11, checked per theme in `themes.node.spec.ts`). `border-line` stays the hairline of cards and dividers; `border-line-strong` the edge of menus and popovers |
| Elevation | `shadow-float` (`--qh-shadow-float`, `0 8px 24px`, 12 % ink in light, 50 % black in dark): floating surfaces only, which the preset gives Modal, menus, Select lists and popovers, and `AdminToastHost` its toasts. Cards, tables and sticky bars stay flat |
| Icons | Lucide at three sizes: 14 (`size-3.5`) dense admin chrome and small chips · 16 (`size-4`) the default, in buttons, inputs and rows · 20 (`size-5`) hero and empty states. `IconButton` and `Chip` draw an icon that has no `size-*` class of its own at the size of their button (16, 20 in `lg`) or chip (14 sm, 16 md) |
| Placeholder | muted text (`placeholder:text-muted` in `TextInput`; the base layer sets the same colour for any other field) |
| Z | `z-sticky` 10 · `z-savebar` 20 · `z-header` 30 · `z-bit` 40 · `z-overlay` 50 · `z-toast` 1200 (above PrimeVue's 1000/1100) |
| Status colour | `warning`/`warning-bg` = verdict-tle pair · `info`/`info-bg` = tag-5 pair (aliases in tokens.css, every theme and accent preset) |
| Spacing | page blocks 24 · card padding 16/20/24 → 32 · form fields 20 · inside a field 6 · button groups 8 |
| Motion | 150/200 ms on colour, border, opacity only; 0 under reduced motion |

`sm` and `base` are Tailwind's own steps and carry their leading; the new steps set font size only, so replacing an exact `text-[Npx]` is pixel-identical. `subtitle`, `section` and `display` (18, 20, 24) name the sizes pages already use. The stock `text-lg` … `text-9xl` are lint-banned (D-03): a site that had one took the step of its size (`text-lg` → `subtitle`, `text-xl` → `section`, `text-2xl` → `display`) and keeps the stock line height with `leading-7` (subtitle, section) or `leading-8` (display) unless it sets its own `leading-*`; the larger ones moved by role (`text-stat` for figures, `text-page` for titles, `text-hero` for countdowns only, `text-score` for the home rating figure).

Admin scope: `AdminShell` puts `qh-admin` on `<html>` while mounted (teleported dialogs included). It sets `--qh-radius-control` to 12 px and `--qh-control` to `--qh-control-sm`.

Lint (`npm run lint:tokens`, `scripts/check-tokens.mjs`) errors on raw colours, stock `rounded-*`/`shadow-*`, stock `text-lg` … `text-9xl`, `rounded-tile`/`rounded-panel`, `text-[<n>px|rem]`, `rounded-[…]` and `z-[…]`. Exceptions are listed by file in `scripts/arbitrary-utilities.mjs` (`ALLOWED`): off-scale display sizes waiting for PageHeader/StatGrid, and radii under 5 px on tiny marks.

## Primitives (`src/components/ui/`)

Built: AppButton/IconButton (+ `buttonClasses`), Chip, Card (+ `CARD_VARIANTS`), Notice, FormField + TextInput/TextArea/SelectField, SaveBar + `useLeaveGuard`, Tabs, SegmentedControl, Switch, PageHeader, DataTable, FilterBar, Modal, Popover, StatGrid, ProgressBar. Props and when to use each: `.claude/skills/qhhoj-web-style/SKILL.md` §3. `Admin*`, `GlassCard`, `PillTabs`, `Settings*` and `Auth*` parts are thin wrappers over them; new code imports `ui/` directly. ESLint (`no-restricted-imports`, `scripts/wrapper-imports.mjs`) rejects a new import of `AdminField`, `AdminChip`, `AdminPageHeader`, `AdminDataTable`, `AdminNotice`, `GlassCard` or the `controls.ts` classes; the files that already import one are listed there, and `docs/wrapper-migration.md` keeps the count per wrapper.

`Switch` is the one on/off control (`AdminSwitch` only adds `lockedBy`). `Popover` is PrimeVue's on the preset and behaves like `Modal`: focus moves to its first control, Tab stays inside, Escape and `hide()` return focus to the opener. `EmptyState` has an `action` slot for the next step; a list that is empty offers one there.

Not built: MarkdownEditor, ListRow, SidebarLayout. Gaps: Notice icon override, Chip `to`, StatGrid slot values, a single toggle button.

## Rules

- One primary action per view. Disabled = `aria-disabled` + token pair, never opacity. Busy = spinner (`AppButton loading`, label kept unless the caller changes it).
- Inputs 16 px, 44 px tall, 12 px corners. Targets ≥ 44 px on coarse pointers.
- Hint ≤ one line (~60 chars); an error replaces it. Optional fields say "(tùy chọn)".
- Feedback: standing state or refusal → inline Notice by its cause; form save → SaveBar text; row/bulk/background → toast. A failure is never toast-only.
- Tables: th 13 muted in sentence case (`text-meta text-muted`, comfortable and compact alike), td 14; numbers right-aligned, mono, tabular, nowrap.
- Empty states offer one next step. Skeletons are shaped from the component.

## Answers (2026-10-12)

1. Admin keeps 12 px control corners through the scoped token; public controls are pills.
2. No 15 px step: 15 in tables and rows → 14 (`text-sm`), 15 in inputs and prose → 16 (`text-base`).
3. Active tab = accent-soft fill + accent border, everywhere.
4. Ranking boards on phones: sticky rank + name, sideways scroll.
5. Public lists stack to cards under 640 px only when they have more than 4 columns.

## Phases

0. Tokens, exact-value codemod, half-pixel and 15 px merges, lint at error (done).
1. Primitives, one PR each, identical output (done, #175-#180).
2. Migrate by area: admin → account/auth → problems/submissions → contests/profile/home → orgs/tickets (done, #181-#190; leftovers listed in the review PR).
3. Visual unification after mock-up picks (PageHeader sizes, problem cards, ranking, stats).
