---
name: qhhoj-web-style
description: Use for any QHHOJ frontend UI work — building or changing Vue components, pages, styles, Tailwind classes, layouts, mock-ups or screenshots, public or admin. Describes Clay, the site's design language: tokens, primitives, layout, phone rules, copy, and the mock-up process.
---

# Clay — QHHOJ web style

Follow this for every change that affects what the site looks like. Long form: `docs/design-language.md` (tokens, primitives, phases) and `design-system/qhhoj/MASTER.md` (themes, colour roles, checklist); page overrides in `design-system/qhhoj/pages/*.md`; Bit mascot in `design-system/qhhoj/mascot.md`.

## 1. Identity

- Clay is the QHHOJ design language. Clay & ivory is its default theme (light-first, ivory ground, white cards, hairline borders, solid clay primary, warm charcoal dark twin). Glass is an optional theme family (`glass-dark`, `glass-light`).
- Components never know the theme. Use semantic utilities (`glass rounded-card`, `bg-surface`, `bg-gradient-accent`, `text-muted`, `border-line`); the theme decides what they render.
- Bit, the pixel mascot, keeps its sprite colours in every theme. Rules: `mascot.md`.

## 2. Tokens

Type scale (font size only; leading comes from the primitive or a `leading-*` class):

| Class                              | px  | Use                                                |
| ---------------------------------- | --- | -------------------------------------------------- |
| `text-tiny`                        | 11  | counts, badges                                     |
| `text-caption`                     | 12  | chips, table headers                               |
| `text-meta`                        | 13  | hints, meta lines, errors, breadcrumbs             |
| `text-sm`                          | 14  | UI, controls, table cells (Tailwind's, leading 20) |
| `text-base`                        | 16  | prose and every input (Tailwind's, leading 24)     |
| `text-title`                       | 17  | card titles (with `font-semibold`/`font-bold`)     |
| `page-title` utility / `text-page` | 26  | the one h1 per page                                |
| `text-stat`                        | 26  | stat values, always with `font-mono tabular-nums`  |
| `text-hero`                        | 40  | countdowns                                         |

Other tokens:

- Control height: `--qh-control` 44 px (default) · `--qh-control-sm` 36 px, 44 on coarse pointers (toolbars, row actions, admin) · `--qh-control-lg` 56 px (submit swap card only). Use as `h-(--qh-control)`.
- Radius by role: controls `rounded-control` (pill on public pages; 12 px under `.qh-admin`) · inputs and code `rounded-cell` 12 · inset tiles and notices `rounded-row` 16 · cards and dialogs `rounded-card` 24 · chips, tabs, segmented `rounded-pill`. No new `rounded-tile` or `rounded-panel`.
- Spacing: page blocks 24 · card padding 16/20/24, up to 32 · form fields 20 apart · label to input 6 · button groups 8.
- Z: `z-sticky` 10 · `z-savebar` 20 · `z-header` 30 · `z-bit` 40 · `z-overlay` 50 · `z-toast` 1200.
- Colour roles: `content`, `muted`, `line`, `accent*`, `positive`, `negative`, `warning`/`warning-bg`, `info`/`info-bg`, `tag-1..8`, `verdict-*` (verdicts only), `tier-*`.
- Motion: `--qh-duration-fast` 150 ms, `--qh-duration` 200 ms, on colour, border and opacity only.
- Admin density: `--qa-row`, `--qa-control`, `--qa-gap`, `--qa-gutter` (`src/features/admin/ui/admin-density.css`).

`npm run lint:tokens` fails on: raw colours outside `src/theme/themes/`, stock `rounded`/`rounded-lg`/`shadow-*` (the theme resets them, they render nothing), `text-[<n>px]`, `rounded-[…]`, `z-[…]`. The only exceptions are listed per file in `ALLOWED` in `scripts/arbitrary-utilities.mjs`; do not add to it without a reason line in the PR.

## 3. Primitives

The kit lives in `src/components/ui/`; new code imports from there. Key props only; read the file for the rest.

| Need                                 | Use                                                | Key props / notes                                                                                                                                                                             |
| ------------------------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button, link button                  | `AppButton`                                        | `tone` primary/secondary/ghost/danger, `size` sm/md/lg, `to` or `href`, `loading` (spinner, label kept), `disabled` (aria-disabled), `block`; slot `#icon`. Admin look comes from `.qh-admin` |
| Icon-only button                     | `IconButton`                                       | `label` (required: aria-label + title), `tone` (default ghost), `size`                                                                                                                        |
| Class string for a non-button (rare) | `buttonClasses()` in `button-classes.ts`           | same tones and sizes                                                                                                                                                                          |
| Status pill, tag, count              | `Chip`                                             | `tone` neutral/accent/success/danger/warning/info/`tag-1..8`/verdict code, `size` sm 22 / md 28, `icon`, `dot`, `interactive`                                                                 |
| Card                                 | `Card`                                             | `variant` glass (page card) / inset (tile) / flat (admin), `padding` sm/md/lg, `as`, `title` + `lead` + `#actions` header                                                                     |
| Inline feedback                      | `Notice`                                           | `tone` info/success/warning/danger, `title`, `compact` (admin), `bit`, `role`; slots `details`, `action`                                                                                      |
| Form field                           | `FormField` + `TextInput`/`TextArea`/`SelectField` | `label`, `hint`, `error`, `required`/`optional`; inputs read id and aria from the field                                                                                                       |
| Save a form                          | `SaveBar` + `useLeaveGuard`                        | `dirtyCount`, `pending`, `savedAt`, `blockedReason`, `variant` page/footer                                                                                                                    |
| Tabs                                 | `Tabs`                                             | `items` (`to` = links, else a tablist with `panelId`), `variant` pill/underline, `overflow` scroll/menu, v-model                                                                              |
| One of a few choices                 | `SegmentedControl`                                 | `options`, v-model, `size` md/sm                                                                                                                                                              |
| Page title block                     | `PageHeader`                                       | `title`, `lead`, `crumbs`, `back`, `meta`, `size` page/compact; slots `#actions`, `#tabs`                                                                                                     |
| Table / list                         | `DataTable` (+ `DataTableColumns.ts`)              | `columns`, `rows`, `rowKey`, `density`, `stack` card/scroll, `stackBelow`, `stickyColumns`, `pager`, sort/selected models                                                                     |
| Search + filters                     | `FilterBar`                                        | `searchLabel`, `chips`, v-model search                                                                                                                                                        |
| Dialog                               | `Modal` (`ConfirmDialog` for confirms)             | `title`, `size` sm/md/lg (full screen < 640)                                                                                                                                                  |
| Facts or stats                       | `StatGrid`                                         | `items` {label, value (string), tone, hint}, `cols`, `mode` fact/stat                                                                                                                         |
| Meter                                | `ProgressBar`                                      | `value`, `max`, `tone`, `label`                                                                                                                                                               |

Also in `src/components/`: `QueryState` (+ `#skeleton`), `SkeletonBlock`, `StatePanel`, `EmptyState`, `NumberedPager`, `ToolbarSearch`, `ToolbarSelect`. Admin-only (`src/features/admin/ui/`): `AdminRowMenu`, `AdminLeaveGuard`, toasts via `use-admin-toast`.

Thin wrappers kept for old call sites: `GlassCard`, `PillTabs`, `AdminPageHeader`, `AdminField`, `AdminChip`, `AdminTabs`, `AdminFilterTabs`, `AdminDataTable`, `AdminFilterBar`, `AdminSaveBar`, `AdminNotice`, `SettingsNotice`, `SettingsCard`, `AuthField`, `controls.ts` and `settings/buttons.ts` classes. Use the `ui/` part in new code.

Known gaps: `Notice` has no icon override, `Chip` has no `to`, `StatGrid` values are plain strings, there is no toggle button (single `aria-pressed`) primitive. Not built: `MarkdownEditor`, `ListRow`, `SidebarLayout`. Until a part exists, reuse the closest one and never hand-roll a new recipe.

## 4. Rules

- One primary action per view.
- Disabled = `aria-disabled` + muted token pair, never `opacity`. A busy button shows a spinner (`AppButton loading`); pass a different label yourself if the action needs one.
- Inputs use 16 px text (`text-base`), at least on touch; touch targets ≥ 44 px on coarse pointers (padding or `::after` hit area).
- Helper text is one line (~60 chars); longer help goes behind a "?" button. An error replaces the hint.
- Feedback: standing state or refusal → inline notice next to its cause; form save result → save bar text; row, bulk and background actions → toast. A failure is never toast-only.
- Tables: numbers right-aligned, `font-mono tabular-nums whitespace-nowrap`; headers `text-meta text-muted`.
- Public lists with more than 4 columns stack to cards under 640 px; others may scroll inside their card.
- Ranking boards on phones: sticky rank + name columns, sideways scroll.
- No horizontal page scroll from 320 to 1440 px (`e2e/topbar-fit.e2e.ts`, `e2e/containment.e2e.ts`).
- Empty states always offer one next step. Skeletons are shaped from the real component, never fixed pixel heights.
- Active tab = `bg-accent-soft` + `text-accent-soft-text` + accent border.
- Copy: Vietnamese first, through i18n (vi and en both), short and plain. Lucide icons only, no emoji.
- Person names in mock-ups, placeholders, examples and fixtures shown on screen: only `thanhngan` / `ricelee` (Thanh Ngân / Rice Lee). Never invent other names.

## 5. Process

- Public visual changes: build several mock-ups and wait for the user's pick before implementing. Admin screens: pick yourself.
- Follow the ui-ux-pro-max skill and its pre-delivery checklist.
- Pure UI fixes need no new tests, but fix every spec the change breaks.
- Take screenshots at 390 and 1440 px and look at them before calling it done.
- Run `npm run lint && npm run lint:tokens` before a PR.
