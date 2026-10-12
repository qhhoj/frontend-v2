# Clay — QHHOJ design language

Clay is the design language of frontend-v2. Clay & ivory is the default theme; Glass is an optional theme family. Theme intent and colour roles: `design-system/qhhoj/MASTER.md`. Values live in code: `src/theme/tokens.css`, the `@theme` blocks in `src/theme/styles.css`, `src/theme/themes/*.css`.

Root problem it fixes: the same control was built four ways (admin `controls.ts`, `settings/buttons.ts` + `AuthField`, hand-spelled public classes, dialog copies). Rule: named tokens only, one primitive kit, density by scope.

## Tokens

| Group | Names |
|---|---|
| Type (font size only) | `text-tiny` 11 · `text-caption` 12 · `text-meta` 13 · `text-sm` 14 · `text-base` 16 · `text-title` 17 · `text-page` 26 · `text-stat` 26 (+ `font-mono`) · `text-hero` 40 |
| Leading (proposed, confirm in the first primitive PR) | tiny/caption 16 px · meta 18 · sm 20 · base 24 · title 22 · page 1.25 · stat/hero 1 |
| Control height | `--qh-control` 44 (md) · `--qh-control-sm` 36, 44 on coarse pointers · `--qh-control-lg` 56 (swap card submit) |
| Radius by role | `rounded-control` (`--qh-radius-control`: pill; 12 in admin) · inputs, code `rounded-cell` 12 · inset tiles, notices `rounded-row` 16 · cards, dialogs `rounded-card` 24 · chips, tabs, segmented `rounded-pill`. `tile` 20 and `panel` 28: no new uses |
| Z | `z-sticky` 10 · `z-savebar` 20 · `z-header` 30 · `z-bit` 40 · `z-overlay` 50 · `z-toast` 1200 (above PrimeVue's 1000/1100) |
| Status colour | `warning`/`warning-bg` = verdict-tle pair · `info`/`info-bg` = tag-5 pair (aliases in tokens.css, every theme and accent preset) |
| Spacing | page blocks 24 · card padding 16/20/24 → 32 · form fields 20 · inside a field 6 · button groups 8 |
| Motion | 150/200 ms on colour, border, opacity only; 0 under reduced motion |

`sm` and `base` are Tailwind's own steps and carry their leading; the new steps set font size only, so replacing an exact `text-[Npx]` is pixel-identical.

Admin scope: `AdminShell` puts `qh-admin` on `<html>` while mounted (teleported dialogs included). It sets `--qh-radius-control` to 12 px and `--qh-control` to `--qh-control-sm`.

Lint (`npm run lint:tokens`, `scripts/check-tokens.mjs`) errors on raw colours, stock `rounded-*`/`shadow-*`, `text-[<n>px|rem]`, `rounded-[…]` and `z-[…]`. Exceptions are listed by file in `scripts/arbitrary-utilities.mjs` (`ALLOWED`): off-scale display sizes waiting for PageHeader/StatGrid, and radii under 5 px on tiny marks.

## Primitives (phase 1, `src/components/ui/`)

AppButton/IconButton, Chip, Card, PageHeader, FormField + inputs, Notice, Tabs/SegmentedControl, DataTable, SaveBar, StatGrid, MarkdownEditor, Modal, FilterBar, ProgressBar, ListRow, SidebarLayout. Each first emits today's classes; `Admin*` parts become re-exports. Until one exists, reuse the closest existing part; never hand-roll a new recipe.

## Rules

- One primary action per view. Disabled = `aria-disabled` + token pair, never opacity. Busy = spinner + changed label.
- Inputs 16 px, 44 px tall, 12 px corners. Targets ≥ 44 px on coarse pointers.
- Hint ≤ one line (~60 chars); an error replaces it. Optional fields say "(tuỳ chọn)".
- Feedback: standing state or refusal → inline Notice by its cause; form save → SaveBar text; row/bulk/background → toast. A failure is never toast-only.
- Tables: th 13 muted, td 14; numbers right-aligned, mono, tabular, nowrap.
- Empty states offer one next step. Skeletons are shaped from the component.

## Answers (2026-10-12)

1. Admin keeps 12 px control corners through the scoped token; public controls are pills.
2. No 15 px step: 15 in tables and rows → 14 (`text-sm`), 15 in inputs and prose → 16 (`text-base`).
3. Active tab = accent-soft fill + accent border, everywhere.
4. Ranking boards on phones: sticky rank + name, sideways scroll.
5. Public lists stack to cards under 640 px only when they have more than 4 columns.

## Phases

0. Tokens, exact-value codemod, half-pixel and 15 px merges, lint at error (done).
1. Primitives, one PR each, identical output.
2. Migrate by area: admin → account/auth → problems/submissions → contests/profile/home → orgs/tickets.
3. Visual unification after mock-up picks (PageHeader sizes, problem cards, ranking, stats).
