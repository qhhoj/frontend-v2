---
name: qhhoj-web-style
description: Use for any QHHOJ frontend UI work — building or changing Vue components, pages, styles, Tailwind classes, layouts, mock-ups or screenshots, public or admin. Describes Workbench, the site's design language (palette A, Paper & Ultramarine): tokens, primitives, layout, phone rules, copy, and the mock-up process.
---

# Workbench — QHHOJ web style

Read `DESIGN.md` at the repo root first (tokens, colour cue map, recipes, owner Do's and Don'ts; where it disagrees with this file, it wins). Follow this for every change that affects what the site looks like. Long form: `docs/design-language.md` (tokens, primitives, phases) and `design-system/qhhoj/MASTER.md` (themes, colour roles, checklist); page overrides in `design-system/qhhoj/pages/*.md`; Bit mascot in `design-system/qhhoj/mascot.md`.

## 1. Identity

- Workbench is the QHHOJ design language (since 2026-11-15; it replaced Clay and Glass). Palette A, Paper & Ultramarine: warm paper ground, opaque cards, hairline borders, small radii, IBM Plex Sans for UI and headings, IBM Plex Mono for code and figures. Modes `light` and `dark` (`html[data-theme]`), contrast `standard` or `high` (`data-contrast`), five accents: ultramarine (default), teal, plum, terracotta, graphite (`data-accent`). Plus a page background (`data-background`, Blueprint by default).
- Colours are generated: `npm run palette` writes `src/theme/palette/*.css` from `scripts/palette/paper.mjs`, solving every pair to its WCAG floor; `npm run lint:palette` (in `npm run lint`) fails on a failing pair or a stale file. Never hand-edit those files; never add a colour elsewhere.
- Components never know the mode, contrast or accent. Use semantic utilities (`glass rounded-card` is an opaque card, `bg-surface`, `bg-accent`, `text-muted`, `text-secondary`, `border-line`).
- Bit, the pixel mascot, keeps its sprite colours in every theme. Rules: `mascot.md`.

## 2. Tokens

Type scale (font size only; leading comes from the primitive or a `leading-*` class):

| Class                              | px  | Use                                                                                         |
| ---------------------------------- | --- | ------------------------------------------------------------------------------------------- |
| `text-tiny`                        | 11  | counts, badges                                                                              |
| `text-caption`                     | 12  | chips, small labels                                                                         |
| `text-meta`                        | 13  | body, controls, inputs, table cells, hints, meta lines, errors                              |
| `text-sm`                          | 14  | UI copy and phone cards (Tailwind's, leading 20)                                            |
| `text-base`                        | 16  | prose (Tailwind's, leading 24); every input on touch (`styles.css`)                         |
| `text-title`                       | 17  | card titles (with `font-semibold`/`font-bold`)                                              |
| `text-subtitle`                    | 18  | lead lines, dialog titles (add a `leading-*`)                                               |
| `text-section`                     | 16  | section titles (`section-title`, `PageSection`)                                             |
| `text-display`                     | 28  | display headings, big numbers (add a `leading-*`)                                           |
| `page-title` utility / `text-page` | 24  | the one h1 per page                                                                         |
| `text-stat`                        | 28  | stat values: `font-mono tabular-nums`; profile rating and overview tiles use `font-display` |
| `text-hero`                        | 40  | countdowns only                                                                             |
| `text-score`                       | 40  | the submission score, the home rating figure                                                |

Other tokens:

- Control height, three steps only: `md` 28 px `--qh-control` (every control, public and admin) · `sm` 24 px `--qh-control-sm` (inside a table or list row) · `lg` 36 px `--qh-control-lg` (submit card only). All three are 44 px or more on a coarse pointer or a phone. Page-level controls pass no `size`. Use as `h-(--qh-control)`.
- Chips: `sm` 22 / `md` 28 px; an interactive chip gets its 44 px hit area from `::after`.
- Dialog widths: `Modal` `sm` 480 · `md` 640 · `lg` 760, full screen under 640 px. No other widths.
- Body text is 13 px (`body`); `font-display` is the body face (Plex Sans).
- Radius by role: controls `rounded-control` 4 · inputs, code and cells `rounded-cell` 4 · inset tiles, rows and notices `rounded-row` 6 · cards and dialogs `rounded-card` 6 (8 on phones) · `rounded-pill` only for switches, dots, avatars and chips. Tabs and segments are `rounded-control`/`rounded-cell`. A menu or popover is `rounded-row`.
- Workbench sizes: `--qh-row` 32 px rows (`DataTable density="compact"`, menu and list options), `--qh-row-dense` 36 px (`comfortable`, board rows), 44 on touch; `--qh-rail` 224 px side rail.
- Spacing: page blocks 24 (`gap-6`) · card padding from `Card padding` (16/20/24, up to 32) · form fields 20 apart (`gap-5`) · label to input 6 · button groups 8 (`gap-2`). Titles: card `text-title` (through `Card title`), section `section-title`, dialog `text-subtitle`; `text-caption` is the 12 px step.
- Z: `z-sticky` 10 · `z-savebar` 20 · `z-header` 30 · `z-bit` 40 · `z-overlay` 50 · `z-toast` 1200.
- Colour roles: `content`, `secondary`, `muted`, `line`, `accent*`, `cue-live|upcoming|ended|full|partial|zero|attention` with `-bg` and `-border` (the colour cue map in `DESIGN.md`; Chip and StatusDot take them as `tone`), `tag-1..8`, `verdict-*` with `-bg`, `-solid` and the label `-on` (verdict parts only), `tier-*`, `diff-1..4`. `positive`, `negative`, `warning`, `info` are the kit's own (Notice, ProgressBar, toasts); pages use a cue or a Chip tone (`lint:tokens` rule `status-colour`).
- Control border: `border-line-control` on inputs, selects, textareas and secondary buttons (3:1 on their ground, WCAG 1.4.11); `border-line` stays the hairline of cards and dividers, `border-line-strong` the edge of menus and popovers.
- Elevation: `shadow-float` on floating surfaces only (Modal, menus, popovers, toasts get it from the kit); everything else is flat.
- Icons (Lucide): 14 dense admin chrome and small chips · 16 default · 20 hero and empty states, stroke 2 (Lucide's default; pass no `:stroke-width`). `IconButton` and `Chip` size an icon with no `size-*` class themselves. Glyphs (✓ ✗ ⋯ ↵) are icons.
- Language marks: the one exception to Lucide-only. A programming language is shown as `LanguageLabel` (icon + name) or `LanguageIcon` (`src/components/language/`): a monochrome logo in the text colour, 16 px inline or a 32 px tile; versions share their language's icon; a language without a logo gets a Lucide icon or a short glyph in the same box. Never print `language.name` bare (native options and sentences excepted), never use a brand mark for anything but a language, never as a control. New logos and their licences: `src/assets/languages/LICENSES.md`.
- Placeholder: muted text, never the content colour at 50 %.
- Motion (`.batch/motion-ux/motion-notes.md`): durations `--qh-duration-instant` 80 · `-fast` 150 · `--qh-duration` 200 · `-emphasis` 320 · `--qh-highlight-decay` 1200 ms; curves `ease-standard`, `ease-exit`, `ease-move`, `ease-spring`. Reduced motion and low power zero every duration, so the end state shows at once; never add a duration that skips the tokens. The kit carries the movement: `pressable` (press scale .97) on buttons, popups grow from their opener, `Modal` scales in from .96, toasts rise on a spring. Elsewhere animate colour, border and opacity only (`transition-colors`); never bare `transition`/`transition-all`/`transition-transform` (real motion is allowlisted with a reason in `scripts/transition-utilities.mjs`).
- Admin density: `--qa-row`, `--qa-control`, `--qa-chip`, `--qa-gap` are global (`src/theme/tokens.css`); `--qa-gutter` and `--qa-sidebar` are admin-shell only (`src/features/admin/ui/admin-density.css`).

`npm run lint:tokens` fails on: raw colours outside `src/theme/palette/`, stock `rounded`/`rounded-lg`/`shadow-*` (the theme resets them, they render nothing; `shadow-float` is ours), stock `text-lg` … `text-9xl` (use the steps above; a swapped `text-xl` keeps its line with `leading-7`), `rounded-tile`/`rounded-panel`, bare `transition`/`transition-all`/`transition-transform`, `uppercase` on a table header, `border-line`/`border-line-strong` on a form control (its border is `border-line-control`), `text-[<n>px]`, `rounded-[…]`, `z-[…]`. The only exceptions are listed per file in `ALLOWED` in `scripts/arbitrary-utilities.mjs`; do not add to it without a reason line in the PR.

## 3. Primitives

The kit lives in `src/components/ui/`; new code imports from there. The part for each need, its key props and the wrapper it replaces: `src/components/ui/README.md` (the one copy; keep it current when a kit prop changes).

Thin wrappers kept for old call sites (ESLint rejects a new import of `AdminField`, `AdminChip`, `AdminPageHeader`, `AdminDataTable`, `AdminNotice` and the `controls.ts` classes; ledger in `docs/wrapper-migration.md`): `PillTabs`, `AdminPageHeader`, `AdminField`, `AdminChip`, `AdminTabs`, `AdminFilterTabs`, `AdminDataTable`, `AdminFilterBar`, `AdminSaveBar`, `AdminNotice`, `AdminSwitch` (adds `lockedBy`), `SettingsNotice`, `AuthNotice`, `SettingsCard`, `AuthField`, `use-admin-toast` (re-exports `useToast`), `controls.ts` classes. Use the `ui/` part in new code.

**Shell** (`src/features/shell/`, build plan step 2). `AppShell` lays out the public pages; the admin area keeps `AdminShell`, the auth pages their own bar.

- Desktop (from `md`): `AppRail` (224 px from 1100 px, `rail-wide:`; a 56 px icon column below, `max-rail-wide:`) beside the page column: brand, search button, the seven sections from `nav-items.ts` (Kỳ thi with "N đang thi"), the live contest card (`RailLiveContest`), the account row (`UserMenu variant="row"`). At the rail's foot one icon row: bell, language, look, collapse (stacked in the 56 px rail). A desktop has no top bar: the section crumb is the first line of each page's header (`PageHeader` shows it by default; `ContestHeader` draws its own); a page's actions sit in its header, never in a Teleport.
- Phone (under `md`): `TopBar` is 56 px (back to the section, the page name or the brand, search, bell or sign-in) and `TabBar` (4 sections + "Tôi", which opens the `PhoneMenu` sheet) is the navigation.
- Rail, top bar and tab bar are opaque: the page background shows behind the page column only. A bar fixed to the page column sits at `left-[var(--shell-rail,0px)]` and `bottom-[var(--tab-bar-height,0px)]`, and clears the home bar with `pb-(--shell-inset-bottom)` (the tab bar keeps it on a phone).
- Contest pages: every tab draws `ContestHeader` (`features/contests/bar/`): the name, phase and format chips, the clock while the viewer's time runs, the freeze chip beside it, then the tabs. The shell's `ContestBar` shows on other pages only (`contest-pages.ts`).
- Search: `CommandPalette` (Ctrl K or ⌘K; the rail button; the phone's search icon) finds sections, account pages, problems, contests and (signed in) users. `/` focuses the page's own search (the first `input[type=search]` in `main`, i.e. a `FilterBar`), else opens the palette. Ctrl K and `/` never fire from a text field, an editor or an open overlay. Shell bars draw their own controls with `AppButton tone="plain"`.

## 4. Rules

The kit part for each job is in `src/components/ui/README.md` (the one table; a job with a part never gets a hand-built recipe).

**No hard-coded values**

- Every value comes from a token or a Tailwind step: no `w-[420px]`, no `style="width: 12px"`, no `12px` in `<style>`, no `bg-red-500` or `text-white`. Missing token: add it in `src/theme/styles.css`. Runtime-computed values go in `ALLOWED` in `scripts/hardcoded-values.mjs` with a reason. DESIGN.md, "No hard-coded values".

**Touch and inputs**

- Every interactive element has a hit area of at least 44×44 px on a coarse pointer (padding or `::after`); every text input renders 16 px text there (13 px with a mouse). OTP cells (60 px) and code editors are the exceptions.
- Helper text is one line (~60 chars); longer help goes behind a "?" button. An error replaces the hint. Optional fields say "(tùy chọn)".
- Disabled = `aria-disabled` + muted token pair with the reason visible (hint or `#note`), never native `disabled` on a button, never `opacity`. A busy button shows a spinner (`AppButton loading`).
- Active tab = a 2 px accent underline (`Tabs`, default); a boxed tab or the rail uses `bg-accent-soft` + `text-accent-soft-text` + accent border; the current segment is raised on `bg-surface-solid`.

**Lists** (one pattern)

- A list page reads: `PageHeader` (title, one primary "Tạo <đối tượng>" in `#actions`), `FilterBar` (search left, filters, active-filter chips), `DataTable`, pager.
- The whole row opens the record through `rowTo` (in admin, its editor); the name cell stays a real link; no separate "Mở"/"Xem"/"Sửa" button repeats the row.
- Other row actions: at most one visible `AppButton size="sm"`, the rest in `RowMenu` ("Thêm thao tác"), destructive items last and red.
- Selection shows `BulkBar`; a bulk result is a toast with a count, per-row failures an inline `Notice` above the table.
- Tables: numbers right-aligned `font-mono tabular-nums whitespace-nowrap`; headers `text-tiny font-semibold text-muted`, 30 px; a verdict is a `VerdictChip`. Public lists with more than 4 columns stack to cards under 640 px; ranking boards are a table with sticky rank + name and 36 px one-line cells that scrolls sideways from 640 px, and below it a list of rank, name, score and mini cells that never scrolls sideways (`RankingTable` renders one of the two). Queues (tickets, reports) keep master-detail; below `xl` the detail replaces the list and has a back bar.
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
- Button looks (`AppButton`): primary is the accent fill, secondary a `line-control` hairline box, ghost text only, danger outlined; icon buttons are square. One look on public and admin pages.
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
- Numbers: `formatNumber` for every number, units and scores included; points are grouped "2.600" with no unit on a row; lengths are `h:mm`; one space before a unit ("1,8 MB", "0,25 s"); scores through `formatFixed`/`scoreBelowFull`.
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
