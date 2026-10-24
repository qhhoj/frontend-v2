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

| Class                              | px  | Use                                                                                         |
| ---------------------------------- | --- | ------------------------------------------------------------------------------------------- |
| `text-tiny`                        | 11  | counts, badges                                                                              |
| `text-caption`                     | 12  | chips, small labels                                                                         |
| `text-meta`                        | 13  | table headers, hints, meta lines, errors                                                    |
| `text-sm`                          | 14  | UI, controls, table cells (Tailwind's, leading 20)                                          |
| `text-base`                        | 16  | prose and every input (Tailwind's, leading 24)                                              |
| `text-title`                       | 17  | card titles (with `font-semibold`/`font-bold`)                                              |
| `text-subtitle`                    | 18  | lead lines, dialog titles (add a `leading-*`)                                               |
| `text-section`                     | 20  | section titles outside cards (add a `leading-*`)                                            |
| `text-display`                     | 24  | display headings, big numbers (add a `leading-*`)                                           |
| `page-title` utility / `text-page` | 26  | the one h1 per page                                                                         |
| `text-stat`                        | 26  | stat values: `font-mono tabular-nums`; profile rating and overview tiles use `font-display` |
| `text-hero`                        | 40  | countdowns only                                                                             |
| `text-score`                       | 56  | the submission score, the home rating figure                                                |

Other tokens:

- Control height: `--qh-control` 44 px (default) · `--qh-control-sm` 36 px, 44 on coarse pointers (toolbars, row actions, admin) · `--qh-control-lg` 56 px (submit swap card only). Use as `h-(--qh-control)`.
- Radius by role: controls `rounded-control` (pill on public pages; 12 px under `.qh-admin`) · inputs and code `rounded-cell` 12 · inset tiles and notices `rounded-row` 16 · cards and dialogs `rounded-card` 24 · chips, tabs, segmented `rounded-pill`. `rounded-tile` and `rounded-panel` no longer exist (lint-banned); a menu or popover is `rounded-row`.
- Spacing: page blocks 24 · card padding 16/20/24, up to 32 · form fields 20 apart · label to input 6 · button groups 8.
- Z: `z-sticky` 10 · `z-savebar` 20 · `z-header` 30 · `z-bit` 40 · `z-overlay` 50 · `z-toast` 1200.
- Colour roles: `content`, `muted`, `line`, `accent*`, `positive`, `negative`, `warning`/`warning-bg`, `info`/`info-bg`, `tag-1..8`, `verdict-*` (verdicts only), `tier-*`.
- Control border: `border-line-control` on inputs, selects, textareas and secondary buttons (3:1 on their ground, WCAG 1.4.11); `border-line` stays the hairline of cards and dividers, `border-line-strong` the edge of menus and popovers.
- Elevation: `shadow-float` on floating surfaces only (Modal, menus, popovers, toasts get it from the kit); everything else is flat.
- Icons (Lucide): 14 dense admin chrome and small chips · 16 default · 20 hero and empty states. `IconButton` and `Chip` size an icon with no `size-*` class themselves.
- Language marks: the one exception to Lucide-only. A programming language is shown as `LanguageLabel` (icon + name) or `LanguageIcon` (`src/components/language/`): a monochrome logo in the text colour, 16 px inline or a 32 px tile; versions share their language's icon; a language without a logo gets a Lucide icon or a short glyph in the same box. Never print `language.name` bare (native options and sentences excepted), never use a brand mark for anything but a language, never as a control. New logos and their licences: `src/assets/languages/LICENSES.md`.
- Placeholder: muted text, never the content colour at 50 %.
- Motion: `--qh-duration-fast` 150 ms, `--qh-duration` 200 ms, on colour, border and opacity only: `transition-colors`, never bare `transition`/`transition-all`/`transition-transform` (real motion such as a chevron turning is allowlisted with a reason in `scripts/transition-utilities.mjs`).
- Admin density: `--qa-row`, `--qa-control`, `--qa-gap`, `--qa-gutter` (`src/features/admin/ui/admin-density.css`).

`npm run lint:tokens` fails on: raw colours outside `src/theme/themes/`, stock `rounded`/`rounded-lg`/`shadow-*` (the theme resets them, they render nothing; `shadow-float` and `shadow-glow` are ours), stock `text-lg` … `text-9xl` (use the steps above; a swapped `text-xl` keeps its line with `leading-7`), `rounded-tile`/`rounded-panel`, bare `transition`/`transition-all`/`transition-transform`, `uppercase` on a table header, `border-line`/`border-line-strong` on a form control (its border is `border-line-control`), `text-[<n>px]`, `rounded-[…]`, `z-[…]`. The only exceptions are listed per file in `ALLOWED` in `scripts/arbitrary-utilities.mjs`; do not add to it without a reason line in the PR.

## 3. Primitives

The kit lives in `src/components/ui/`; new code imports from there. The part for each need, its key props and the wrapper it replaces: `src/components/ui/README.md` (the one copy; keep it current when a kit prop changes).

Thin wrappers kept for old call sites (ESLint rejects a new import of `AdminField`, `AdminChip`, `AdminPageHeader`, `AdminDataTable`, `AdminNotice`, `GlassCard` and the `controls.ts` classes; ledger in `docs/wrapper-migration.md`): `GlassCard`, `PillTabs`, `AdminPageHeader`, `AdminField`, `AdminChip`, `AdminTabs`, `AdminFilterTabs`, `AdminDataTable`, `AdminFilterBar`, `AdminSaveBar`, `AdminNotice`, `AdminSwitch` (adds `lockedBy`), `SettingsNotice`, `SettingsCard`, `AuthField`, `controls.ts` and `settings/buttons.ts` classes. Use the `ui/` part in new code.

## 4. Rules

- One primary action per view.
- Disabled = `aria-disabled` + muted token pair, never `opacity`. A busy button shows a spinner (`AppButton loading`); pass a different label yourself if the action needs one.
- Inputs use 16 px text (`text-base`), at least on touch; touch targets ≥ 44 px on coarse pointers (padding or `::after` hit area).
- Helper text is one line (~60 chars); longer help goes behind a "?" button. An error replaces the hint.
- Feedback: standing state or refusal → inline notice next to its cause; form save result → save bar text; row, bulk and background actions → toast. A failure is never toast-only.
- Tables: numbers right-aligned, `font-mono tabular-nums whitespace-nowrap`; headers `text-meta text-muted`.
- Public lists with more than 4 columns stack to cards under 640 px; others may scroll inside their card.
- Ranking boards on phones: sticky rank + name columns, sideways scroll.
- No horizontal page scroll from 320 to 1440 px.
- Empty states always offer one next step (`EmptyState`'s `#action` slot). Skeletons are shaped from the real component, never fixed pixel heights.
- Active tab = `bg-accent-soft` + `text-accent-soft-text` + accent border.
- Copy: Vietnamese first, through i18n (vi and en both), short and plain. Lucide icons only (language marks through `LanguageIcon` excepted), no emoji. Dates: only `formatDate` presets from `src/lib/format-date.ts` (`short`, `date`, `datetime`; seconds only in logs), never `toLocale*String` or `Intl.DateTimeFormat` (`npm run lint:dates`).
- Person names in mock-ups, placeholders, examples and fixtures shown on screen: only `bitcoder` (a handle, not a real-looking personal name). Never invent other names.

## 5. Process

- Public visual changes: build several mock-ups and wait for the user's pick before implementing. Admin screens: pick yourself.
- Follow the ui-ux-pro-max skill and its pre-delivery checklist.
- Pure UI fixes need no new tests, but fix every spec the change breaks.
- Take screenshots at 390 and 1440 px and look at them before calling it done.
- Run `npm run lint && npm run lint:tokens` before a PR.
