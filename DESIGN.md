# DESIGN.md

Read this before any UI work in frontend-v2. It is the short rulebook; the long form is `.claude/skills/qhhoj-web-style/SKILL.md` (tokens, rules, copy) and `src/components/ui/README.md` (kit props). To see every token and kit part, open `/dev/kit` (admin only). If this file and another doc disagree, this file wins; fix the other one.

Structure after the shadcn design-system idea: tokens, then recipes, then Do's and Don'ts, then gaps.

## Controls ("Sơn mài", 2026-11-20)

One control set on every page; `/dev/kit` shows it first ("Bộ điều khiển"). Where an older line below disagrees, this section wins.

- Shape tells the kind: a rounded rectangle (`rounded-control`, 4 px) can be clicked; a pill is a label and cannot.
- Heights: 40 px (`md`, `--qh-control`) and 32 px (`sm`, `--qh-control-sm`: tables and panel headers); 44 px on touch. Fields, selects and the search box are 40 px with the border and radius of a button (`FormField.control.ts`).
- Buttons (`AppButton`): `primary` (brand fill, one per page), `secondary` (surface + control border), `quiet` (brand text, no border), `danger` (the secondary shape with red text and a red icon; hover as secondary). `ghost` and `lg` are old names of quiet and md. Inside a `Readout` primary and secondary take the plate's colours. `link` is a text link (brand text, underline on hover); a section's "Xem tất cả" is `AppButton tone="link"`.
- Icon-only buttons (`IconButton`, `AppButton icon-only`): a quiet square in neutral ink (`secondary` text), never brand. `label` is required and is both the `aria-label` and the tooltip. `tone="secondary"` adds the border, `tone="danger"` makes the icon red.
- States, the same for all: hover = raised ground (primary: darker brand); focus = 2 px brand ring (a field: brand border + soft ring); disabled = 45 % opacity (`--qh-opacity-disabled`) with the reason beside it; pending = a spinner in place of the icon.
- Filter toggles (`Chip pressed|to|removable`, `SegmentedControl`, `SelectField prefix` in a toolbar, a label around a checkbox or radio through `TOGGLE_CHECKABLE`): 32 px rounded rectangles; on = soft brand ground + brand border + brand text. Never the primary look. Anything you can click is a rectangle: a link around a pill is a bug.
- Status tags (`Chip`): pills on the raised ground, no border, no hover, not clickable; `strong` = ink semibold. A tone colours only the dot or icon.
- Tabs: underline only. Cards: one style (`Card`: 1 px line, 6 px corners, 16 px padding; `panel` = a flush header row). Section header: `PageSection`. Save bar: `SaveBar`, one per page.
- Scales: spacing 2·4·8·12·16·24·32·48·64; type 12·13·14·15·16·18·20·24·28·32·40; weights 400·500·600·650·700; control heights 40·32; rows 44 (52 on touch); radius 2·4·6·pill; durations 0.12·0.2·1.2 s. A value off a scale is a bug: snap it, or add a named token in `src/theme/tokens.css` and say why. Named tokens that are widths, not steps of a scale: DataTable column widths, Modal and Drawer widths, `--pane-submit`, `--qh-rail` (224), `--qh-stat-col-min` (96).

### Colour roles

One meaning per colour, the same on every page; the words always say it too.

| Colour                         | Meaning                                                                                                                                          | Tokens                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Huế purple (brand)             | what you can act on and where you are: primary button, links, focus ring, current menu item and tab, a toggle that is on, the bar on my own rows | `accent*`, `--qh-focus-ring`                                                   |
| Red                            | one family: wrong answer, error, destructive action                                                                                              | `negative` (= `verdict-wa`), `Notice tone="danger"`, `AppButton tone="danger"` |
| Green, lime, amber, grey, blue | verdicts only: accepted, partial, time/memory/runtime failure, compile error, judging                                                            | `verdict-*` through `VerdictChip`, `Lamp`, `TestSquares`, `Gauge`              |
| Gold                           | merit: a top-three rank and nothing else (no silver, no bronze)                                                                                  | `merit`, `lib/medal.ts`                                                        |
| Neutral ink                    | everything that measures the thing and not the viewer: an AC rate, a solver count (`ProgressBar tone="neutral"`), icon-only buttons              | `content`, `secondary`, `muted`                                                |

No row tints by verdict: the colour sits on the lamp, the code and the score. The plate (`Readout`) is the only dark surface and shows only what the judge or the clock measured.

### Placement

Fixed; a page that needs an exception is a design bug.

| Area                                   | Left / first                                                    | Right / last                                                                                           |
| -------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Page header (`PageHeader`)             | eyebrow, title (`titleTo` when it names another page), sub line | page buttons, primary last (a page with a sticky side panel puts its primary at the top of that panel) |
| Plate (`Readout`)                      | the state or the biggest measurement                            | other measurements, then buttons, primary last                                                         |
| Toolbar (`Toolbar`, `FilterBar`)       | search, then filter toggles                                     | count or a secondary tool                                                                              |
| Section header (`PageSection`, `Card`) | title                                                           | meta, link or quiet button                                                                             |
| Table                                  | status, name                                                    | numbers right-aligned, time last                                                                       |
| Content                                | main column                                                     | side panel of fixed width (above the content on a phone)                                               |
| Pager                                  | position                                                        | previous, next                                                                                         |

### Formats

Time, memory, limits and file sizes: only the functions of `src/lib/measure.ts` (imported from `@/lib/format`): number, a no-break space, unit; the decimal mark follows the locale. Measured: "1,05 s", "3,5 MB" (en "1.05 s"). Limits: "1,0 s", "256 MB". Files: "1,8 MB", "64 KB".

## 1. Tokens

Values live in code: `src/theme/tokens.css`, `@theme` in `src/theme/styles.css`, `src/theme/palette/*.css` (generated by `npm run palette`; never hand-edit, never add a colour elsewhere). Components never know the mode, contrast or accent: use semantic utilities only (`bg-surface`, `text-muted`, `border-line`, `bg-accent`).

### Type roles

Be Vietnam Pro (text), Archivo at width 112 % and weight 650 (headings, `font-display`) and JetBrains Mono (code and numbers); line height 1.5 (`--qh-leading`) for running text. Nothing is smaller than 13 px except the `kbd` hint and a numeral inside a mark (12).

| Class               | px / line | Role                                                                          |
| ------------------- | --------- | ----------------------------------------------------------------------------- |
| `text-page`         | 28 / 32   | the one H1 of a page (only through `PageHeader`), weight 650                  |
| `text-heading`      | 18 / 24   | Card and Panel title, Dialog title, section titles (`PageSection`)            |
| `text-long`         | 16 / 26   | long reading: statements, contest intro, posts; `text-content` or `secondary` |
| `text-body`         | 15 / 22   | table cells, list rows, buttons, fields, tabs, menu items (row names 500)     |
| `text-meta`         | 14 / 21   | facts lines, form labels, counts, table footer                                |
| `text-small`        | 13 / 20   | table head (600, muted), problem codes (mono), chip text (600)                |
| `text-kbd`          | 12        | the `kbd` shortcut hint only                                                  |
| `text-stat`/`score` | 28/40     | stat values and the submission score (mono)                                   |

Deprecated type classes, kept as aliases until their last user moves to a role: `text-tiny` and `text-caption` (both now 13, = `text-small`), `text-section`, `text-title`, `text-subtitle` (all now 18, = `text-heading`), `text-section-legacy` (20), and `text-sm` (Tailwind's 14, use `text-meta`). Figures, codes and times use `font-mono tabular-nums`. No `text-[13px]`, no stock `text-lg`.

### Geometry: heights, radii, surfaces

Every value is a variable in `src/theme/tokens.css`; components never write a number. Under touch (`pointer: coarse` or 640 px and narrower) every control is 44 or more and every row at least 44.

| Token                                    | px               | Used by                                                                 |
| ---------------------------------------- | ---------------- | ----------------------------------------------------------------------- |
| `--qh-control-sm`                        | 32               | tables and panel headers: row actions, the table pager, filter toggles  |
| `--qh-control`                           | 40               | every button, field, select, search box and tab                         |
| `--qh-control-lg`                        | 40               | old name of `--qh-control`                                              |
| `--qh-chip`                              | 24               | status tag (`Chip`), `VerdictChip`                                      |
| `--qh-row`                               | 44 (52 on touch) | every list row and table row                                            |
| `--qh-row-dense`                         | 44               | old name of `--qh-row`                                                  |
| `--qh-touch`                             | 44               | the touch height of every control and row                               |
| `--qh-control-px-sm` / `--qh-control-px` | 12 / 16          | horizontal padding of sm / md controls and of fields                    |
| `--qh-pad-surface`, `--qh-pad-dialog`    | 16, 24           | padding of a surface (Card, panel) and of a Dialog or Sheet             |
| `--qh-gap-control`, `--qh-gap-block`     | 8, 16            | gap between controls; between a toolbar and content or between surfaces |

Radius by rule: a control is 4 (`rounded-control`); a surface (card, panel, plate) is 6 (`rounded-card`); a box nested in a surface is 4 (`rounded-row`); a small square mark (checkbox, kbd, test square) is 2 (`--qh-radius-mark`); `rounded-pill` only for status tags, lamps, switches and avatars. Nothing you can click is a pill.

Surfaces: the page ground (`bg-ground`), the surface with a 1 px line (`Card`, tables), the raised ground (`bg-surface-strong`: hover, status tags, inset code) and the overlay (`overlay-surface`: Menu, Popover, Dialog, Sheet, Toast). A control draws the control border (`border-line-control`, 3:1). An invalid field draws a red border on the red tint.

Tables: every table, including the hand-built ones, takes its row and head height from `components/ui/table-classes.ts` (44, 52 on touch; head 13 semibold muted on the row surface; hairlines between rows, no frame). Floating layers (Menu, Popover, Dialog, Sheet, Toast) use the `overlay-surface` utility: surface tone, 1 px `--qh-line` ring, float shadow; Menu items are 40, radius 8. Step 2 removed no alias, because about 170 files still use the radius names and `text-sm`/`text-tiny`.

Deprecated token names, kept as aliases while many files use them: `--qh-radius-card` (= `--qh-radius-surface`), `--qh-radius-row` (= `--qh-radius-nested`), `--qh-radius-cell` (= `--qh-radius-mark`), `--qh-radius-pill`, `Card` `padding` `sm` and `lg` (= `md`, 20), Tabs `variant="underline"` (draws the pill row, same as `pill`), the CSS class `glass` (no border now), `--qa-chip` (= `--qh-control`).

### Spacing, widths, radii

- Spacing roles (`--space-*`, smaller on a phone): `page-top` 24 · `header` 16 · `toolbar` 12 · `section` 32 · `section-title` 8 · `stack` 12. Use them as `gap-(--space-section)`, not raw numbers.
- Page width by role (`PageLayout width`): `wide` 80 rem (lists, normal pages) · `split` 120 rem (statement beside submit) · `read` 46 rem (long reading, forms).
- Motion only on colour, border and opacity; the kit carries real movement. Z layers: `z-sticky` `z-savebar` `z-header` `z-bit` `z-overlay` `z-toast`.

### Colour cue map

Colour is a cue: one meaning, the same on every page, as text or a light tint, never decoration. The text always says the same thing; colour only repeats it. Each cue has three tokens (`cue-<name>` text, `cue-<name>-bg` tint, `cue-<name>-border`), all aliases of palette tokens (so contrast holds in every mode and contrast level):

| Cue         | Meaning                                   | Palette source      | Where it shows               |
| ----------- | ----------------------------------------- | ------------------- | ---------------------------- |
| `live`      | running now (contest open, judging)       | green (verdict AC)  | dot + text, chip             |
| `upcoming`  | not started                               | blue (tag-1)        | dot + text, chip             |
| `ended`     | finished or inactive                      | grey (muted)        | dot + text, chip             |
| `full`      | accepted, full score                      | green               | tint on a problem cell, chip |
| `partial`   | some points, not all                      | lime (verdict part) | tint                         |
| `zero`      | wrong after a try (not tried stays empty) | red (verdict WA)    | tint                         |
| `attention` | needs action or warning (access code)     | amber               | chip                         |

Attempted, not solved: icon only, no row tint (owner 2026-11-16).

Other colour meanings, unchanged: an acceptance rate has no colour (a neutral bar and the number; the five-colour ramp went with the "Sơn mài" problem list); rating = tier colour (`tier-*`); rating change = `cue-full` for a gain, `cue-zero` for a loss; ranks 1 to 3 = gold only (`lib/medal.ts`: a gold disc, a gold ring, a plain ring; `medalClass` for a rank in a line of text); tags = `tag-1..8`.

Cue tokens versus verdict tokens: a submission's own result parts (`VerdictChip`, test strip, cases table, ranking cells, problem status mark) keep `verdict-*` (lists in `scripts/raw-element-rules.mjs`, `VERDICT_PARTS`). Everything else that says live, upcoming, ended, full, partial, zero or needs-attention uses `cue-*`. `positive`/`negative`/`warning`/`info` remain for `Notice`, `ProgressBar`, `StatGrid` and toasts inside the kit; pages use a Chip or StatusDot tone, not those classes (lint rule `status-colour`).

## 2. Component recipes

One job, one kit part (`src/components/ui/`); a job with a part never gets a hand-built recipe.

| Job                              | Part                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| Page frame                       | `PageLayout` (width) + `PageHeader` (title, `facts`, actions)                                |
| Section of a page                | `PageSection` (title, count, see-all)                                                        |
| Row between header and content   | `Toolbar` (search left, count and sort right, chips below)                                   |
| List of records                  | `DataTable` with `rowTo`; cards under 640 px; `variant="ledger"` on a page                   |
| Status, tag, count               | `Chip tone=` (cue, status or tag); `StatusDot` before a word                                 |
| Verdict of a submission          | `VerdictChip`                                                                                |
| Buttons                          | `AppButton` (one primary per view), `IconButton`                                             |
| Text, number, date inputs        | `TextInput`, `DateTimeField`, `SelectField`, `TextArea` in `FormField`                       |
| Choice                           | `Checkbox`, `Switch`, `RadioGroup`, `ChoiceCards`, `SegmentedControl`                        |
| Switch between views of one page | `Tabs` (underline) or `SegmentedControl` (filter toggles)                                    |
| Hide details until asked         | `Disclosure` / `FoldPanel`                                                                   |
| Standing message                 | `Notice` next to its cause                                                                   |
| Result of an action              | toast (`useToast`); a failure is also an inline `Notice`                                     |
| Row or card that opens a record  | `Card to`, `DataTable rowTo`, or `box-link` + `StretchedLink`                                |
| Menu, row actions                | `Menu`, `RowMenu` (destructive last)                                                         |
| Nothing here / loading           | `EmptyState` with `#action` (`inline` under a section title); `QueryState` + `SkeletonBlock` |
| Save edits                       | `SaveBar` + `useLeaveGuard`                                                                  |

### Frames

A frame (card) goes only around one destination or one form; lists are ledgers. `DataTable` takes `variant`: `surface` (default) is the card, `ledger` has no fill, radius or end padding, a hairline under every row (the last too), a stronger rule under the head, `bg-surface-hover` on a row that opens a page, and one-line rows on a phone (title, caption line, value at the right). A ledger's empty state is `EmptyState inline` (one row, 24 px Bit, the fact, then the next fact). Page numbers go in `PageHeader facts` (mono value, optional cue tone), not in boxes; `PageSection count` is mono 13 px. `--pane-submit` (460 px) is the width of the submit pane beside the statement.

## 3. Do's and Don'ts (owner rules)

Do:

- Make the whole box clickable: a card, row or tile that stands for one destination is one link (`Card to`, `rowTo`, `StretchedLink`), never only its title or a small "Xem" button.
- Keep rows compact: one line per record, facts side by side, a page about two screens long.
- Let the main column carry the content; keep the rail collapsible.
- Fold details until asked (`Disclosure`); open editors on demand.
- Use colour only as a cue from the map above; say it in words too.
- Write Vietnamese first, through i18n; one verb per action.
- One format per fact, everywhere:
  - dates `dd/MM/yyyy` (through `formatDate`);
  - lengths `h:mm` (a 90-minute contest is "1:30");
  - points grouped with a dot, "2.600", with no unit on a row (the column header or page says "điểm");
  - other numbers through `formatNumber`.
- Show a fact once per screen.
- Use kit components and tokens; keep to the type, spacing and width roles.

Don't:

- Add side filler: empty rails, decorative panels or illustrations that carry no information.
- Add decoration with no meaning: gradients, ornaments, coloured headings, coloured icons.
- Hand-build what a kit part does (raw `<button>`, `<a>`, `<table>`, `<details>`).
- Use a raw colour, an arbitrary value (`text-[13px]`, `z-[5]`) or a stock Tailwind palette class.
- Use `verdict-*` outside verdict parts, or `text-positive`/`bg-negative-bg` etc. in pages (use cues).
- Hand-roll a disabled look; the kit control draws it (45 % opacity) and shows the reason.
- Repeat a primary action in a row that is already a link.
- Use emoji or text glyphs; use Lucide icons.

## No hard-coded values

Every value, from colour to spacing, comes from a variable, so a theme change swaps it in one place (owner rule, 2026-11-16).
Token families: colour (`text-content`, `bg-surface`, `--qh-*`), type scale (`text-caption` ... `text-hero`), radius (`rounded-<role>`), shadow (`shadow-glow|float`), z (`z-<layer>`), motion (`--qh-duration-*`, `ease-*`), and Tailwind's own spacing and size steps (`p-4`, `gap-2`, `size-4`, `w-64`).
`npm run lint:tokens` (rule `hardcoded-value`, `scripts/hardcoded-values.mjs`) refuses a file that gains an arbitrary value with a number (`w-[420px]`), a stock palette or white/black utility, an inline style or `<style>` length with a unit (`12px`, `0.2s`). 0, 50% and 100% pass.
The same rule family covers script code (rule `hardcoded-script-value`, `scripts/hardcoded-script-values.mjs`, in .ts and the `<script>` and `:style` of .vue, not specs or `src/theme/`): a string with a CSS unit (`'12px'`, `'300ms'`), a literal wait (`setTimeout(fn, 300)`, debounce/throttle, `duration:`/`delay:` of `animate`), a literal number on `el.style.width` or a layout key of a style object, and a number in a UI-size constant (`ROW_HEIGHT = 44`, `*_PX`, `*_MS`, `*_GAP`...). 0, 1, -1, 100, indices, page sizes, limits, arithmetic and media-query strings pass. Scripts import `durationMs('fast')` (`src/theme/motion.ts`) and `sizePx('control')` (`src/theme/sizes.ts`), which read the CSS variables, so a theme or reduced-motion change reaches them. Run-time geometry (FLIP, chart measures) goes in `SCRIPT_ALLOWED` with a one-line reason.
Existing hits sit in `scripts/raw-element-baseline/<area>.json` and only shrink (`npm run raw-elements:shrink`).
To add a token: define it in `src/theme/styles.css` (`@theme`) or, for a colour, in `scripts/palette/paper.mjs` then `npm run palette`; use it by name. A value computed at run time (a FLIP transform, chart geometry) goes in `ALLOWED` in `scripts/hardcoded-values.mjs` with a one-line reason.

## 4. Known gaps

- Cue tokens exist but most pages still use `text-positive`, `bg-warning-bg` and similar status classes (baselined under `status-colour`, 186 uses in 126 files). Convert page by page; the baseline only shrinks (`npm run raw-elements:shrink`).
- `text-title`, `text-subtitle` and `text-section-legacy` have users left.
- `/dev/kit` shows one mode at a time (the mode switch is in its header), because the palette scopes light and dark to the root element.
- Difficulty and tier colours are separate scales outside the cue map; they are not yet in the gallery.
