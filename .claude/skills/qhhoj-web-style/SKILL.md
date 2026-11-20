---
name: qhhoj-web-style
description: Use for any QHHOJ frontend UI work — building or changing Vue components, pages, styles, Tailwind classes, layouts, mock-ups or screenshots, public or admin. Describes "Sơn mài", the site's design language (Huế purple brand, the dark measurement plate, one control set): tokens, scales, controls, placement, colour roles, phone rules, copy, and the mock-up process.
---

# Sơn mài — QHHOJ web style

Read `DESIGN.md` at the repo root first (controls, colour roles, placement table, tokens, recipes, owner Do's and Don'ts; where it disagrees with this file, it wins). Follow this for every change that affects what the site looks like. `/dev/kit` (admin only) shows every control with all its states: look at it before building. Kit props: `src/components/ui/README.md`.

## 1. Identity

- "Sơn mài" is the QHHOJ design language (since 2026-11-20; it replaced Workbench). Warm ground, opaque surfaces with a 1 px line, small radii. Be Vietnam Pro for UI, Archivo (width 112 %, weight 650) for headings, JetBrains Mono for code and numbers. Modes `light` and `dark` (`html[data-theme]`).
- Design is code: no magic numbers, fixed placement, one component per job, one meaning per colour, each fact shown once, names by role, nothing on a page without a flow that needs it.
- Colours are generated into `src/theme/palette/*.css` (`npm run palette`; `npm run lint:palette` fails on a failing pair or a stale file). Never hand-edit those files; never add a colour elsewhere. Components never know the mode or the palette: use semantic utilities (`bg-surface`, `bg-accent`, `text-muted`, `border-line`).
- The plate (`Readout`, `ReadoutCell`) is the only dark surface, in light and in dark mode. It shows only what the judge or the clock measured: verdict, score, tests, time, memory, countdown, rank. A mark that belongs to a reading's label goes in `ReadoutCell #label`.
- Bit, the pixel mascot, stays: logo, avatars, empty states. Rules: `mascot.md`.

## 2. Scales and tokens

Every size, space, type size, weight, radius, border width, opacity, duration and z-index is a token on these scales. A value off a scale is a bug: snap it, or add a named token in `src/theme/tokens.css` and say why in the PR.

| Scale          | Steps                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Spacing        | 2 · 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 px                                                                                                |
| Type           | 12 (numerals inside a mark, `kbd`) · 13 · 14 · 15 · 16 · 18 · 20 · 24 · 28 · 32 · 40 px                                                   |
| Weight         | 400 · 500 · 600 · 650 (headings) · 700                                                                                                    |
| Control height | 40 (`md`, `--qh-control`) · 32 (`sm`, `--qh-control-sm`); both 44 on touch                                                                |
| Row height     | 44 (`--qh-row`); 52 on touch                                                                                                              |
| Radius         | 2 (marks) · 4 (controls, `rounded-control`) · 6 (cards, panels, the plate, `rounded-card`) · pill (status tags, lamps, switches, avatars) |
| Duration       | 0.12 s (colour or press) · 0.2 s (a move) · 1.2 s (the judging pulse)                                                                     |

Type roles (font size and line height come with the class):

| Class                                               | px           | Use                                                                    |
| --------------------------------------------------- | ------------ | ---------------------------------------------------------------------- |
| `page-title` / `text-page`                          | 28           | the one h1 of a page, only through `PageHeader`                        |
| `text-heading`                                      | 18           | card, panel, dialog and section titles (`section-title`, display font) |
| `text-long`                                         | 16           | long reading: statements, posts                                        |
| `text-body`                                         | 15           | body, table cells, buttons, fields, tabs                               |
| `text-meta`                                         | 14           | facts lines, form labels, counts                                       |
| `text-small`                                        | 13           | table heads, codes, status tags                                        |
| `text-kbd`                                          | 12           | `kbd` hints and numerals inside a mark only                            |
| `text-readout` / `text-readout-word` / `text-score` | 20 / 24 / 40 | the plate: a value, a verdict in words, the big numeral                |

Other tokens:

- Named widths (tokens, not scale steps): `--qh-rail` 224 · `--pane-submit` · `Modal` and `Drawer` widths · DataTable column widths · page widths by role (`PageLayout width`: `wide`, `split`, `read`).
- Spacing roles: `--space-page-top`, `--space-header`, `--space-toolbar`, `--space-section`, `--space-stack`; surface padding `--qh-pad-surface` 16, dialog 24; gap between controls 8.
- Control border: `border-line-control` on fields, selects and secondary buttons (3:1, WCAG 1.4.11; lint rule `control-borders`); `border-line` is the hairline of cards and dividers.
- Z: `z-sticky` · `z-savebar` · `z-header` · `z-bit` · `z-overlay` · `z-toast`. Elevation: `shadow-float` on floating surfaces only.
- Icons (Lucide): 16 default; a button or chip sizes an icon with no `size-*` class itself. An icon sits before a label. Language marks go through `LanguageLabel` / `LanguageIcon`.
- Motion only explains a state change (countdown tick, judging pulse, test squares lighting in order). Reduced motion and low power zero every duration.

`npm run lint:tokens` fails on raw colours, arbitrary values with a number, stock palette classes, stock `rounded`/`shadow-*`/`text-lg…` steps and inline style numbers.

## 3. Controls

One set on every page, student and teacher alike. Nothing outside this list; before adding a component or a variant, search the kit.

- **Shape tells the kind.** A rounded rectangle can be clicked; a pill is a label and cannot. Never wrap a pill in a link.
- **Buttons** (`AppButton`): `primary` (purple fill; the one main action, at most one visible per page), `secondary` (surface + border; every other action), `quiet` (purple text, no border; a small action in a row or panel header), `danger` (the secondary shape with red text and a red icon). `link` is a text link to another page (also the "Xem tất cả" of a section). On the plate primary and secondary take the plate's colours by themselves.
- **Icon-only buttons** (`IconButton`): a quiet square in neutral ink, never purple. `label` is required: it is the `aria-label` and the tooltip.
- **States, the same for all:** hover = raised ground (primary: darker purple); focus = 2 px purple ring; disabled = 45 % opacity with the reason beside it (`disabledReason`), through `aria-disabled`; pending = a spinner in place of the icon.
- **Fields** (`TextInput`, `SelectField`, `SearchInput`, `TextArea`, `ComboBox` in `FormField`): 40 px, the control border, 4 px radius; focus = purple border. `SelectField prefix` is the toolbar filter select.
- **Filter toggles** (`Chip pressed|to|removable`, `SegmentedControl`): 32 px rectangles; on = soft purple ground + purple border + purple text, the cue of the current menu item. Never the primary look.
- **Status tags** (`Chip`): pills on the raised ground, no border, no hover, not clickable; `strong` = ink text. A tone colours only the dot or icon.
- **Verdicts:** `VerdictChip` (lamp + mono code; `named` adds the words; `still` stops the judging pulse), `Lamp`, `TestSquares`, `Gauge`.
- **Tabs** (`Tabs`): underline only; `rail` is a side menu from `lg`. **Cards** (`Card`): one style (1 px line, 6 px, 16 px padding); `panel` is the same card with a flush header row. **Section header:** `PageSection`. **Save bar:** `SaveBar`, one per page, shown only when something is unsaved; while it shows, "Lưu" is the primary.
- **Bars:** `ProgressBar`; `tone="neutral"` for a number that measures the thing and not the viewer (AC rate, solvers).

Colour roles: purple = action and "you are here"; red = wrong, error, destructive (one family); verdict colours = results only; gold = top-three rank only (`lib/medal.ts`); everything else is neutral ink. Table in `DESIGN.md`.

Placement is fixed (table in `DESIGN.md`): header = eyebrow, title, sub line | page buttons, primary last; plate = state or biggest measurement | other measurements, then buttons; toolbar = search, filter toggles | count or secondary tool; section header = title | meta, link or quiet button; table = status, name | numbers right-aligned, time last; content = main column | side panel; pager = position | previous, next.

The kit lives in `src/components/ui/`; new code imports from there. Thin wrappers kept for old call sites (ESLint rejects a new import; ledger in `docs/wrapper-migration.md`): the `Admin*` components and the classes of `features/admin/ui/controls.ts`, which are aliases of the kit's recipes.

**Shell** (`src/features/shell/`, build plan step 2). `AppShell` lays out the public pages; the admin area keeps `AdminShell`, the auth pages their own bar.

- Desktop (from `md`): `AppRail` (224 px `--qh-rail` from 1100 px, `rail-wide:`; an icon column below, `max-rail-wide:`; collapsible) beside the page column: brand with Bit, search button, the sections from `nav-items.ts`, the account row (`UserMenu variant="row"`). The global ranking is not in the menu or on the home page; it stays reachable from a profile.
- Phone (under `md`): `TopBar` is 56 px (back to the section, the page name or the brand, search, bell or sign-in) and `TabBar` (4 sections + "Tôi", which opens the `PhoneMenu` sheet) is the navigation.
- Rail, top bar and tab bar are opaque: the page background shows behind the page column only. A bar fixed to the page column sits at `left-[var(--shell-rail,0px)]` and `bottom-[var(--tab-bar-height,0px)]`, and clears the home bar with `pb-(--shell-inset-bottom)` (the tab bar keeps it on a phone).
- Contest: the contest page draws the plate (`ContestPlate`: countdown, my rank and score, timeline) and its tabs. Inside a running contest a sticky plate strip shows on problem and submission pages (contest name, countdown, my rank and score, problem letters with my status); it does not show on the contest page itself.
- Search: `CommandPalette` (Ctrl K or ⌘K; the rail button; the phone's search icon) finds sections, account pages, problems, contests and (signed in) users. `/` focuses the page's own search (the first `input[type=search]` in `main`, i.e. a `FilterBar`), else opens the palette. Ctrl K and `/` never fire from a text field, an editor or an open overlay. Shell bars draw their own controls with `AppButton tone="plain"`.

## 4. Rules

The kit part for each job is in `src/components/ui/README.md` (the one table; a job with a part never gets a hand-built recipe).

**No hard-coded values**

- Every value comes from a token or a Tailwind step: no `w-[420px]`, no `style="width: 12px"`, no `12px` in `<style>`, no `bg-red-500` or `text-white`. Missing token: add it in `src/theme/styles.css`. Runtime-computed values go in `ALLOWED` in `scripts/hardcoded-values.mjs` with a reason. DESIGN.md, "No hard-coded values".

**Touch and inputs**

- Every interactive element has a hit area of at least 44×44 px on a coarse pointer (the kit's controls are 44 px tall there); every text input renders 16 px text there. OTP cells and code editors are the exceptions.
- Helper text is one line (~60 chars); longer help goes behind a "?" button. An error replaces the hint. Optional fields say "(tùy chọn)".
- Disabled = `aria-disabled` with the reason visible (`disabledReason`, a hint or `#note`), never native `disabled` on a button; the kit draws the look (45 % opacity). A busy button shows a spinner (`AppButton loading`).
- Current tab = ink text with a 2 px purple bar under it (`Tabs`); the current item of a side menu and a toggle that is on = soft purple ground + purple border + purple text.

**Lists** (one pattern)

- A list page reads: `PageHeader` (title, one primary "Tạo <đối tượng>" in `#actions`), `FilterBar` (search left, filters, active-filter chips), `DataTable`, pager.
- The whole row opens the record through `rowTo` (in admin, its editor); the name cell stays a real link; no separate "Mở"/"Xem"/"Sửa" button repeats the row.
- Other row actions: at most one visible `AppButton size="sm"`, the rest in `RowMenu` ("Thêm thao tác"), destructive items last and red.
- Selection shows `BulkBar`; a bulk result is a toast with a count, per-row failures an inline `Notice` above the table.
- Tables: status and name first, numbers right-aligned `font-mono tabular-nums whitespace-nowrap`, time last; heads 13 px semibold muted; rows 44 px (52 on touch); a verdict is a `VerdictChip`; no row tint by verdict (my own rows carry a left bar). Public lists with more than 4 columns stack to rows under 640 px.
- No horizontal page scroll from 320 to 1440 px.

**Create**

- Creating starts from the list's `PageHeader` primary, labelled "Tạo <đối tượng>", never from an always-open inline card or a row menu.
- A small record (8 fields or fewer) opens an `EditDrawer` (`Drawer` + form + `SaveBar variant="footer" allowClean` + leave guard) that also edits it. A large record (problem, contest) has a create page with only the required fields and lands on the editor's first unfinished step. A short public create is a `Modal` + `#footer`; a long one (ticket, post) is its own page.
- Success navigates to the new record; a failure is an inline `Notice`.

**Save** (one commit model per screen: page, editor tab, drawer or dialog)

- Fields save through `SaveBar` + `useLeaveGuard`. The label is "Lưu" and the noun goes in the status text; "Hủy thay đổi" asks to confirm when more than one change is pending; an editor tab with unsaved changes shows a dot and the count.
- A SaveBar screen has no per-card Save button. A sub-record with its own lifecycle (webhook, test archive, file) opens in a `Modal` or `Drawer` with its own footer. A card on a tab without a page SaveBar may carry `SaveBar variant="footer"`, which is then the tab's one model.
- Instant actions (applied on click) are for on/off state, uploads and lifecycle actions (publish, freeze, rejudge, delete). Each one shows its state next to the control ("Đang hiển thị · áp dụng ngay"), confirms when it changes what other users see or cannot be undone (`ConfirmDialog`, or `Switch confirm`), and on a screen with unsaved edits is offered as "Lưu rồi <động từ>" or blocked with the reason. An on/off inside a form saved later is a `Checkbox`.
- Feedback: standing state or refusal → `Notice` next to its cause (`inline` for one line); form save → SaveBar text ("Đã lưu lúc 14:02", no toast); row, bulk and background actions → toast. A failure is an inline `Notice` next to its cause, never toast-only.

**Primary action**

- One primary per view, the right-most button of its row, with Cancel and secondary actions to its left (`gap-2`). Dialogs and drawers put the row in the footer, right-aligned; forms use the SaveBar; a one-field inline form puts its button right of the field; a page-level create goes in `PageHeader #actions`. Single-card auth forms use a full-width primary.
- Button looks: section 3. One look on public and admin pages.
- Danger is never a form's primary. Destructive actions sit in a danger zone (the last section) or as the last `RowMenu` item, and never within 8 px of a neutral toggle.

**Destructive actions**

- Every destructive or irreversible action opens `ConfirmDialog tone="danger"`: the title asks the question, the body gives the consequence in one line, the confirm label is verb + object ("Xóa thẻ", "Gỡ liên kết Polygon", "Cấm bitcoder"), never "OK" or a bare "Xóa".
- Irreversible deletes of records that hold data (problems, contests, organizations) use `TypedCodeDialog`. A removal staged in a SaveBar form needs no dialog (the bar confirms); a reversible row or bulk action (hide, archive) needs none either, and its toast offers "Hoàn tác". `ConfirmDialog` only confirms; anything with fields is a `Modal`.

**Copy**

- Vietnamese first, through i18n (vi and en both), short and plain. One verb per action; shared verbs live in `common.*` only, namespaces never redefine them, and the kit reads no `admin.*` key:

  | Action                     | Verb                                                                            | Action                   | Verb             |
  | -------------------------- | ------------------------------------------------------------------------------- | ------------------------ | ---------------- |
  | Save edits                 | Lưu                                                                             | Create a record          | Tạo <đối tượng>  |
  | Close without acting       | Hủy                                                                             | Add a row to a form list | Thêm             |
  | Throw away edits           | Hủy thay đổi                                                                    | Open a record's editor   | Sửa              |
  | Delete                     | Xóa <đối tượng>                                                                 | Open read-only / all     | Xem / Xem tất cả |
  | Remove from a list, unlink | Gỡ (Gỡ liên kết)                                                                | Close a panel            | Đóng             |
  | Stop a running job         | Dừng (Dừng chấm)                                                                | Retry                    | Thử lại          |
  | Rejudge / rescore          | Chấm lại / Tính lại điểm                                                        | Copy                     | Sao chép         |
  | Apply / clear filters      | Áp dụng / Xóa bộ lọc                                                            | Undo                     | Hoàn tác         |
  | Send a message             | Gửi                                                                             | Submit a solution        | Nộp bài          |
  | Join a contest             | "Đăng nhập để tham gia" (anonymous), "Tham gia", "Vào thi" (joined and running) | Leave                    | Rời              |
  | Show / hide to users       | Hiện / Ẩn                                                                       | Mark read                | Đánh dấu đã đọc  |

- Lucide icons only (language marks through `LanguageIcon` excepted), no emoji, no text glyphs. `ExternalLink` only for links that leave the site.
- Dates: only `formatDate` presets from `src/lib/format-date.ts` (`short`, `date`, `datetime`; seconds only in logs), never `toLocale*String` or `Intl.DateTimeFormat` (`npm run lint:dates`). Lists and feeds use the one relative helper with the absolute value in `title`; detail pages and logs show the absolute value. Typed dates use `DateTimeField` (site zone, labelled "GMT+7").
- Numbers: `formatNumber` for counts; points are grouped "2.600" with no unit on a row; lengths are `h:mm`; scores through `formatFixed`/`scoreBelowFull`. Time, memory, limits and file sizes only through `lib/measure.ts` (`formatCaseTime`, `formatCaseMemory`, `formatTimeLimit`, `formatMemoryLimit`, `formatFileSize`, imported from `@/lib/format`): a no-break space before the unit and the locale's decimal mark ("1,05 s", "3,5 MB", "256 MB"; English "1.05 s").
- Tones, one vocabulary: `neutral · accent · success · warning · danger · info`, and the seven cues `live · upcoming · ended · full · partial · zero · attention` for a state with one fixed meaning. `verdict-*` classes appear only in verdict parts (`lib/verdicts.ts` is the one source); everything else uses a cue.
- Show a fact once per screen: a rating, time, language or status is not repeated in two blocks; an empty block is hidden or merged into the nearest relevant card.
- Empty states always offer one next step (`EmptyState`'s `#action`, `DataTable #emptyAction`; `lint:tokens` checks it); an unknown record id is a `StatePanel kind="notFound"` with a way back, never a bare line; a loading state is `QueryState` with a `#skeleton` shaped from the real component, never fixed pixel heights.
- Person names in mock-ups, placeholders, examples and fixtures shown on screen: only `bitcoder` (a handle, not a real-looking personal name).

## 5. Process

- Explore visual changes as mock-ups built with the stageshow skill (faux product UI, stills or short animations, kept outside the repo in `.batch/`). Pick the option yourself, record it in `docs/decisions.md`, then port it to real Vue components with the tokens and primitives above. The mock-up is the reference for the port, not code to copy: stageshow is React; this app is Vue.
- Check a port against its mock-up: screenshot the real page at the mock-up's width and compare.
- Pure UI fixes need no new tests, but fix every spec the change breaks.
- Take screenshots at 390 and 1440 px and look at them before calling it done.
- Run `npm run lint` before a PR.

## Whole-box links

- A box (card, row, tile, list item) that stands for one destination is clickable as a whole, never only through its title or a small "Xem" button. Use `Card to`/`href` (+ `linkLabel` if untitled), `DataTable rowTo`, or `box-link` + `StretchedLink` for a custom box. Inner links and buttons that do something else stay clickable above the cover. Details: `src/components/ui/README.md`.
