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

- Control height, three steps only: `md` 44 px `--qh-control` (every public control, toolbars included) · `sm` 36 px, 44 on coarse pointers `--qh-control-sm` (every control under `.qh-admin`, and any control inside a table or list row) · `lg` 56 px `--qh-control-lg` (submit swap card only). The scope sets the height: page-level controls pass no `size`, and `size="sm"` appears only inside a row. Use as `h-(--qh-control)`. The `--qa-*` density tokens are global theme tokens, so a control's size never depends on the page opened first.
- Chips: `sm` 22 / `md` 28 px; an interactive chip gets its 44 px hit area from `::after`.
- Dialog widths: `Modal` `sm` 480 · `md` 640 · `lg` 760, full screen under 640 px. No other widths.
- Radius by role: controls `rounded-control` (pill on public pages; 12 px under `.qh-admin`) · inputs and code `rounded-cell` 12 · inset tiles and notices `rounded-row` 16 · cards and dialogs `rounded-card` 24 · chips, tabs, segmented `rounded-pill`. `rounded-tile` and `rounded-panel` no longer exist (lint-banned); a menu or popover is `rounded-row`.
- Spacing: page blocks 24 (`gap-6`) · card padding from `Card padding` (16/20/24, up to 32) · form fields 20 apart (`gap-5`) · label to input 6 · button groups 8 (`gap-2`). Titles: card `text-title` (through `Card title`), section `section-title`, dialog `text-subtitle`; `text-caption` is the 12 px step.
- Z: `z-sticky` 10 · `z-savebar` 20 · `z-header` 30 · `z-bit` 40 · `z-overlay` 50 · `z-toast` 1200.
- Colour roles: `content`, `muted`, `line`, `accent*`, `positive`, `negative`, `warning`/`warning-bg`, `info`/`info-bg`, `tag-1..8`, `verdict-*` (verdicts only), `tier-*`.
- Control border: `border-line-control` on inputs, selects, textareas and secondary buttons (3:1 on their ground, WCAG 1.4.11); `border-line` stays the hairline of cards and dividers, `border-line-strong` the edge of menus and popovers.
- Elevation: `shadow-float` on floating surfaces only (Modal, menus, popovers, toasts get it from the kit); everything else is flat.
- Icons (Lucide): 14 dense admin chrome and small chips · 16 default · 20 hero and empty states, stroke 2 (Lucide's default; pass no `:stroke-width`). `IconButton` and `Chip` size an icon with no `size-*` class themselves. Glyphs (✓ ✗ ⋯ ↵) are icons.
- Language marks: the one exception to Lucide-only. A programming language is shown as `LanguageLabel` (icon + name) or `LanguageIcon` (`src/components/language/`): a monochrome logo in the text colour, 16 px inline or a 32 px tile; versions share their language's icon; a language without a logo gets a Lucide icon or a short glyph in the same box. Never print `language.name` bare (native options and sentences excepted), never use a brand mark for anything but a language, never as a control. New logos and their licences: `src/assets/languages/LICENSES.md`.
- Placeholder: muted text, never the content colour at 50 %.
- Motion: `--qh-duration-fast` 150 ms, `--qh-duration` 200 ms, on colour, border and opacity only: `transition-colors`, never bare `transition`/`transition-all`/`transition-transform` (real motion such as a chevron turning is allowlisted with a reason in `scripts/transition-utilities.mjs`).
- Admin density: `--qa-row`, `--qa-control`, `--qa-gap`, `--qa-gutter` (`src/features/admin/ui/admin-density.css`).

`npm run lint:tokens` fails on: raw colours outside `src/theme/themes/`, stock `rounded`/`rounded-lg`/`shadow-*` (the theme resets them, they render nothing; `shadow-float` and `shadow-glow` are ours), stock `text-lg` … `text-9xl` (use the steps above; a swapped `text-xl` keeps its line with `leading-7`), `rounded-tile`/`rounded-panel`, bare `transition`/`transition-all`/`transition-transform`, `uppercase` on a table header, `border-line`/`border-line-strong` on a form control (its border is `border-line-control`), `text-[<n>px]`, `rounded-[…]`, `z-[…]`. The only exceptions are listed per file in `ALLOWED` in `scripts/arbitrary-utilities.mjs`; do not add to it without a reason line in the PR.

## 3. Primitives

The kit lives in `src/components/ui/`; new code imports from there. The part for each need, its key props and the wrapper it replaces: `src/components/ui/README.md` (the one copy; keep it current when a kit prop changes).

Thin wrappers kept for old call sites (ESLint rejects a new import of `AdminField`, `AdminChip`, `AdminPageHeader`, `AdminDataTable`, `AdminNotice`, `GlassCard` and the `controls.ts` classes; ledger in `docs/wrapper-migration.md`): `GlassCard`, `PillTabs`, `AdminPageHeader`, `AdminField`, `AdminChip`, `AdminTabs`, `AdminFilterTabs`, `AdminDataTable`, `AdminFilterBar`, `AdminSaveBar`, `AdminNotice`, `AdminSwitch` (adds `lockedBy`), `SettingsNotice`, `SettingsCard`, `AuthField`, `controls.ts` and `settings/buttons.ts` classes. Use the `ui/` part in new code.

## 4. Rules

The kit part for each job is in `src/components/ui/README.md` (the one table; a job with a part never gets a hand-built recipe).

**Touch and inputs**

- Every interactive element has a hit area of at least 44×44 px on a coarse pointer (padding or `::after`); every text input renders 16 px text at every width. OTP cells (60 px) and code editors are the exceptions.
- Helper text is one line (~60 chars); longer help goes behind a "?" button. An error replaces the hint.
- Disabled = `aria-disabled` + muted token pair with the reason visible (hint or `#note`), never native `disabled` on a button, never `opacity`. A busy button shows a spinner (`AppButton loading`).
- Active tab = `bg-accent-soft` + `text-accent-soft-text` + accent border.

**Lists** (one pattern)

- A list page reads: `PageHeader` (title, one primary "Tạo <đối tượng>" in `#actions`), `FilterBar` (search left, filters, active-filter chips), `DataTable`, pager.
- The whole row opens the record through `rowTo` (in admin, its editor); the name cell stays a real link; no separate "Mở"/"Xem"/"Sửa" button repeats the row.
- Other row actions: at most one visible `AppButton size="sm"`, the rest in `RowMenu` ("Thêm thao tác"), destructive items last and red.
- Selection shows `BulkBar`; a bulk result is a toast with a count, per-row failures an inline `Notice` above the table.
- Tables: numbers right-aligned `font-mono tabular-nums whitespace-nowrap`; headers `text-meta text-muted`. Public lists with more than 4 columns stack to cards under 640 px; ranking boards keep sticky rank + name and scroll sideways. Queues (tickets, reports) keep master-detail; below `xl` the detail replaces the list and has a back bar.
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
- Numbers: `formatNumber` for every number, units and scores included; one space before a unit ("1,8 MB", "0,25 s"); scores through `formatFixed`/`scoreBelowFull`.
- Tones, one vocabulary: `neutral · accent · success · warning · danger · info`. `verdict-*` classes appear only in verdict parts (`lib/verdicts.ts` is the one source).
- Show a fact once per screen: a rating, time, language or status is not repeated in two blocks; an empty block is hidden or merged into the nearest relevant card.
- Empty states always offer one next step (`EmptyState`'s `#action`); a loading state is `QueryState` with a `#skeleton` shaped from the real component, never fixed pixel heights.
- Person names in mock-ups, placeholders, examples and fixtures shown on screen: only `bitcoder` (a handle, not a real-looking personal name).

## 5. Process

- Public visual changes: build several mock-ups and wait for the user's pick before implementing. Admin screens: pick yourself.
- Follow the ui-ux-pro-max skill and its pre-delivery checklist.
- Pure UI fixes need no new tests, but fix every spec the change breaks.
- Take screenshots at 390 and 1440 px and look at them before calling it done.
- Run `npm run lint && npm run lint:tokens` before a PR.
