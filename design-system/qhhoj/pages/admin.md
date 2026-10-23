# Admin pages (override of MASTER.md)

Applies to every route under `/admin`. Audit and redesign done 2026-10-11 with UI UX Pro Max (Data-Dense Dashboard style, density 8, its pre-delivery checklist); its palette and fonts were not taken: Clay & ivory and the token stacks stay. This file records intent; the code is the truth.

## Decisions (orchestrator picks, pending user review)

1. **Density** bends MASTER's "touch targets >= 44 px" for `/admin` only: 40 px rows and 36 px controls on `pointer: fine` (targets >= 24 px, WCAG 2.2 target size); 48 px rows and 44 px controls on `pointer: coarse`.
2. **Radius**: cards `rounded-row` (16), controls and buttons `rounded-cell` (12). Pills only for chips, segmented filters and status.
3. **User editor**: a right-hand drawer (560 px, `role="dialog"`, tabs).
4. **Permission codenames** are hidden everywhere and replaced by human text; superusers get the codename in a tooltip.
5. **Fonts**: the token stacks in `src/theme/tokens.css` win (body `--qh-font-body`, display `--qh-font-display`, mono `--qh-font-mono`).

## Top defects (most severe first)

| # | Defect | Rule | Where |
|---|---|---|---|
| 1 | The user edit dialog is taller than the viewport and opens scrolled to the middle, so its title and close button are off screen. It stacks 5 independent forms (profile, account, password, reset link, access), each with its own save button, separated by `<hr>`. "Vô hiệu hóa tài khoản" sits among routine fields. | escape-routes, focus-management, progressive-disclosure, confirmation-dialogs | `users/UserEditDialog.vue`; the dialog preset in `src/theme/primevue-preset.ts` has no max-height or scrolling body |
| 2 | The sticky save bars have no z-index, no dirty count and no discard. The disabled pill looks like an enabled button. On phone they cover field labels (Language new, Problem general). There are four separate implementations, each placed differently: right for problems, left for contests, split for languages. | focus-not-obscured, consistency, submit-feedback | `problems/general/ProblemGeneralTab.vue`, `problems/data/ProblemDataTab.vue`, `contests/general/ContestGeneralTab.vue`, `languages/LanguageSaveBar.vue` |
| 3 | **Horizontal page scroll** on `/admin/config` at 390: the page is 576 px wide. | horizontal-scroll | `site/MiscConfigPage.vue` (config table) |
| 4 | **Tables are not responsive.** There are 34 hand-made `<table>` files. At 390 the contests list wraps dates one word per line (~12 lines per row). Users, submissions and activity rely on a "Vuốt ngang để xem thêm cột" hint with clipped columns. Deleted-problems row buttons wrap to 3 lines. There is no card fallback anywhere. | Table Handling, content-priority, truncation-strategy | `contests/ContestsIndexPage.vue`, `search/ProblemSearchList.vue`, `users/UsersTable.vue`, `submissions/*`, `activity/*`, `problems/lifecycle/DeletedProblemsPage.vue` |
| 5 | **List pages are filter walls.** Problems, contests and users stack a "lookup by exact code" card above a separate search card, plus a segmented filter, then 3–4 selects. On phone the first result appears at about y=950. Sorting is a `<select>`, never a column header. The segmented filter is clipped at 390 ("Đề xuất" is cut off). | content-priority, progressive-disclosure, primary-action | `ProblemsIndexPage.vue`, `ContestsIndexPage.vue`, `users/UserLookupCard.vue` + `UsersFilters.vue`, `ui/AdminFilterTabs.vue` |
| 6 | **Row actions pile up**, and destructive red outlines are used for non-destructive actions. Judges have 4–5 pill buttons per card (Tắt, Chặn, Khóa, Ngắt, Xóa, Chi tiết). Posts have 4 buttons per row. Contest actions show "Tính lại điểm" (recompute) with a red danger outline. Bulk bars are always visible, even with 0 selected. | primary-action, state-clarity, color-not-decorative-only | `judges/*`, `posts/PostsTable.vue`, `contests/actions/*`, `comments/CommentsAdminPage.vue` |
| 7 | **No feedback system.** There is no toast primitive anywhere in `src`. Success is a small inline "Đã lưu" next to the button. Dirty-leave guards exist only for drafts, judges and integrations. They are missing on the problem/contest general forms, language, settings and the user dialog. | success-feedback, sheet-dismiss-confirm, undo-support | `ui/use-admin-mutation.ts`, `problems/drafts/use-draft-leave-guard.ts` (only 3 users) |
| 8 | **Developer text leaks into the UI**: raw permission codenames as chips ("Quyền: judge.import_polygon_package", "Cần quyền judge.moss_contest", dashboard tile footers with codename + path); API routes ("lưu riêng bằng PUT /translations/:lang", "Ảnh tải lên qua /problems/uploads/image"); long implementation paragraphs on `/admin/log` and `/admin/config`. | error-clarity, visual-hierarchy | 12 `needsPermission` sites; `i18n/admin/{polygon,similarity,rejudge,shell,settings,site,problems}.vi.json` |
| 9 | **Navigation is overloaded.** The sidebar has 30 always-expanded items in 5 groups; its chevrons collapse nothing useful and it is not sticky, so long editors lose it. The phone nav is a `<details>` summary whose title truncates ("Sửa kỳ thi: bài trong kỳ …"). Editor tabs (8 for contests) scroll off the right edge at 390 with no affordance. Admin Bits overlap the sidebar (contest Data/Ranking, users edit). | nav-hierarchy, overloaded nav, z-index-management | `shell/AdminShell.vue`, `shell/AdminNav.vue`, `ui/AdminTabs.vue`, `shell/AdminBit.vue` placements |
| 10 | **Width and density waste on desktop.** Config, tickets, zip import and similarity use half the 1440 width. Problem rows are 69 px tall with a pill "Sửa" button on each. The problem General tab also repeats the Files tab's attachment uploads (`ProblemAttachmentsSection`), plus clone, danger zone and the Polygon panel, giving a 3 700 px page with no section nav. | whitespace-balance, container-width, consistency | `problems/general/ProblemGeneralTab.vue` lines 28–74; `site/`, `tickets/`, `problems/import/` page grids |

More defects:
- `shadow-lg` on the comments bulk bar and `glass` on `SubmissionBulkBar` break MASTER's "no drop shadows / opaque overlays" rule.
- Three Bits decorate the headers of users, organizations, quotas and tickets. That breaks mascot.md's "one placement, beside text".
- Pagination shows enabled "Trang trước / Trang sau" on one page. About 28 hand-rolled pagers exist while `components/NumberedPager.vue` is already available.
- The off-state switch thumb (`bg-content`) reads like a radio dot. In dark mode the off thumb is white on charcoal, while the on track is clay.
- Labels end in an ellipsis ("Tên đăng nhập...").
- Dates use native `datetime-local` and render `mm/dd/yyyy, --:-- --` on this host. This needs checking on a vi-locale machine, but it does not show the site timezone either way.
- Disabled primary actions ("Tiếp tục", "Bắt đầu nhập", "Lưu thay đổi") are a pale accent-soft pill and look like a secondary button. There is no reason text.
- Filter UIs are inconsistent: radios for tickets, a segmented control for problems, selects for comments, checkbox pills for submissions. Some auto-apply, some need "Lọc" or "Tìm".

## What is already right (keep)

- Contrast is checked by `themes.node.spec.ts`.
- Focus rings and skip links work, and Lucide icons are used throughout.
- Skeletons, `QueryState` and `StatePanel` are in place.
- Dark mode is designed as a pair.
- Labels sit above inputs, with help text below.
- Most row-action buttons have an `aria-label`.

## Shared admin design system

Committed home: `design-system/qhhoj/pages/admin.md` (page override of MASTER). Values come from tokens only.

### Page layout grid
- **Shell**: sidebar 248 px, `position: sticky; top: 0; height: 100dvh`, scrolls on its own. Content column `minmax(0,1fr)` with 32 px side padding (16 px under 768). There is no global max width for list pages: tables use the width. Single-form pages cap at 880 px; editors are 880 px form + 240 px section rail.
- **Breakpoints**: 390, 768, 1024, 1280, 1440. Sidebar ≥ 1024. A collapsible icon rail is available from 1024 to 1279. Phone/tablet use the top bar and a nav sheet.
- **Vertical rhythm** (4 pt): page header → 24 → toolbar → 12 → table/card. Between form sections: 16 (inside one card) or 24 (separate cards).

### Page header and actions bar
- One component, `AdminPageHeader`, kept and extended. It holds the breadcrumb (desktop), H1 (display 24/600), an optional one-line lead (muted 14) and actions on the right.
- **One primary action per page.** Secondary actions use the outline style. Any third or later action goes into a `⋯ Thêm` overflow menu. Example: problems has "Tạo bài tập" as primary and a split "Nhập ▾" for Polygon and .zip.
- On phone, the breadcrumb collapses to a back link ("‹ Bài tập"). The H1 is 20/600 and the actions become a single row (primary + overflow) under the title.
- **Editors** (problem, contest) use a sticky editor header. It holds the title, code chip, status chip and "Xem bài ↗", with tabs underneath. It compacts to 56 px on scroll, and the save bar is at the bottom.

### Density scale (admin only)
| Token | fine pointer | coarse pointer |
|---|---|---|
| `--qa-row` table row | 40 px | 48 px |
| `--qa-control` input, select, button | 36 px | 44 px |
| `--qa-chip` | 24 px | 32 px (hit area 44) |
| `--qa-gap` grid gap | 12 px | 12 px |
| Card padding | 16 / 20 px | 16 px |

These are defined in `src/features/admin/ui/admin-density.css` under `@media (pointer: coarse)` and imported by `AdminShell.vue`. Text never goes below 12 px, and body stays at 16 on phone inputs (no iOS zoom).

### Typography and spacing tokens
- Display: `--qh-font-display`. H1 24/600, section 16/600, card title 14/600 caps-free.
- Body: `--qh-font-body`. Forms 15/1.5, tables 14/1.45, help and meta 13/1.4 muted.
- Mono: `--qh-font-mono` with `tabular-nums` for codes, IDs, points, times and limits. Numbers are right-aligned.
- Spacing: 4, 8, 12, 16, 24, 32. No other values.

### Data tables: `AdminDataTable` (new, `ui/table/`)
- Props: columns (key, label, sortable, align, `priority: 'primary' | 'secondary' | 'meta'`), rows, `rowKey`, selection, `sort` (v-model bound to the `?sort=` query string; the existing values such as `newest` keep working), `loading`, `error`.
- **Header**: sticky inside the card (`top: 0` of the scroll region), 13/600 muted, sentence case (`text-meta text-muted`, as in every `DataTable`). Sortable headers are buttons with `aria-sort` and a 14 px chevron.
- **Rows**: 40 px. Hover uses `surface-hover`. The primary column is a link (name 14/600 + mono code 12 muted underneath). Status columns use chips. Numbers are right-aligned and mono.
- **Row actions**: at most one visible text or icon action (e.g. "Sửa"), plus a `⋯` menu (`AdminRowMenu`). Destructive items go last, in red, separated, and always confirm. Icon-only buttons have an `aria-label` and a tooltip.
- **Selection and bulk bar**: the checkbox column shows only when bulk actions exist; each box is 16 px with a 44 px hit area on coarse pointers (`DataTableCheckbox`). The bulk bar (`AdminBulkBar`) replaces the toolbar while a selection exists. It shows "3 đã chọn · Bỏ chọn" and the actions, has no shadow, and uses a `surface-strong` fill.
- **States** (via `QueryState`): skeleton rows matching the real row count; empty (EmptyState: one nightcap Bit, one line, one action); filtered-empty ("Không có kết quả cho bộ lọc này · Xóa bộ lọc"); error with retry inside the card.
- **Pager**: `NumberedPager` plus "1–50 / 312". Hidden when there is only one page.
- **Mobile (< 768)**: card list, one card per row. Line 1: primary column + status chip. Line 2: the secondary columns as "Label value" facts at most two lines, separated by a gap, never by "·" (a wrapped dot orphans); a fact is never split, and a `stacked` column is a fact without its label. Line 3: the "Chi tiết" button (`AppButton` sm, 44 on coarse pointers) for the columns with `priority: 'meta'`, and the actions. Badges sit beside the title, or under it when they would squeeze it. The page never scrolls horizontally. A table that must keep its grid (test lists) scrolls inside `ScrollRegion` with a fade edge, not a text hint.

### Filter bar: `AdminFilterBar` (new)
One row:
1. Search field, debounced 250 ms, auto-applied. If the query matches an exact code or username, a "Mở hcmus41c ↵" row appears at the top and Enter opens it. This replaces the separate lookup cards.
2. Segmented view filter (`AdminFilterTabs`).
3. A "Bộ lọc (2)" button that opens a popover (phone: bottom sheet) holding the selects.
4. Active filters as removable chips under the bar, with "Xóa tất cả".

Everything syncs to the query string. No "Lọc" or "Tìm" buttons. Results count sits at the right ("312 bài").

### Forms
- **Sections**: `AdminFormSection` renders a title (16/600), an optional one-line description and a 2-column grid ≥ 1024 (1 column below). Sections are separated by hairlines inside one card, not a card per section. Long editors get a section rail (≥ 1280, sticky, scroll-spy links) and a "Đi tới mục" select on phone.
- **Fields**: `AdminField`, kept. The label is above. Required fields get a ` *` with a visually hidden "bắt buộc". Helper text sits below the field. The error goes below the field, replaces the helper, is linked with `aria-describedby`, is validated on blur, and carries an icon + text.
- **Switches versus checkboxes**: a switch only for an immediate on/off setting. Inside a form that is saved later, use checkboxes with a description. `AdminSwitch` is the kit `Switch` (`src/components/ui/Switch.vue`) plus `lockedBy`. Off: track `surface-strong` + `line-strong` border, muted thumb. On: accent track, `on-accent` thumb. Locked: muted pair, and the permission in words under it.
- **Date and time**: one `AdminDateTimeField` that always shows and accepts the site timezone (Asia/Ho_Chi_Minh), formatted `dd/MM/yyyy HH:mm`, with a "GMT+7" suffix and a "Bây giờ" shortcut. A filter that takes a day alone (the log's from/to) sets `dateOnly`: `dd/MM/yyyy`, no shortcut, never a native `type="date"` picker (it shows `mm/dd/yyyy`). Dates shown in a row, card or log go through `formatDate` (`short`, `date`, `datetime`; `datetimeSeconds` for logs), never a hand-rolled format.
- **Save bar**: one `AdminSaveBar`.
  - Sticky to the bottom of the content column, `z-index` 30, `surface-solid` with a top hairline. `scroll-padding-bottom` on the page equals the bar's height, so focus is never covered.
  - Left side: "3 thay đổi chưa lưu" (polite live region), or "Đã lưu lúc 14:02".
  - Right side: "Hủy thay đổi" (ghost) and "Lưu" (primary). Disabled when there are no changes, with `aria-disabled` and the reason as text.
  - It replaces the 4 current bars.
- **Dirty guard**: `useDirtyGuard(isDirty)` handles `onBeforeRouteLeave` and `beforeunload` with a ConfirmDialog ("Rời trang? 3 thay đổi chưa lưu sẽ mất"). It generalises `use-draft-leave-guard`.
- **Danger zone**: the last section, with a red hairline. Each action is a row with a title, one line of consequence and a danger button. Each one confirms, and a type-to-confirm is required for irreversible deletes.

### Dialogs, drawers and confirmations
- Dialog preset (in `src/theme/primevue-preset.ts`, shared): `max-height: calc(100dvh - 2rem)`. The header is fixed, the content scrolls (`overflow:auto`), and the footer is fixed with actions on the right. Focus starts on the first field or the title, never mid-body.
- `AdminDrawer` (new): right side, 560 px, full screen under 768. It has a header (title, meta chips, close), optional tabs, a scrolling body and a footer save bar. It is used for user edit, judge details, ticket preview and flat-page edit.
- `ConfirmDialog`: kept. Destructive confirms use the danger tone, and the confirm label names the action ("Xóa bài hcmus41c", not "OK").

### Feedback
- `AdminToast` (new, `ui/feedback/`): bottom-right (phone: bottom centre above the safe area), max 3 stacked, `role="status"`, auto-dismiss after 4 s (errors stay until closed). Optional "Hoàn tác" for reversible bulk actions. Wire it once in `use-admin-mutation.ts` (success text param).
- Inline status stays for field-level errors.
- `AdminNotice` (new): a tone (info, caution, danger), a title and a one-line summary, with "Chi tiết" expanding the long explanation. It replaces the multi-paragraph Bit banners on config, log, activity and settings.

### Navigation
- **Sidebar groups** (`shell/admin-nav.ts`): Tổng quan · Bài tập · Kỳ thi · Chấm bài · Cộng đồng · Người dùng · Trang web.
  - Each group can collapse. The current group stays open. Collapse state is kept in `localStorage`.
  - Counts (open reports, open tickets, requests) are pills on the right.
  - The permission footnote is removed (one line in the docs is enough).
- **Command palette** (`Ctrl K`): kept. It lists screens and recent objects, and opens a problem, contest or user by exact code.
- **Phone**: top bar (logo · search icon · menu icon). The menu opens a full-height sheet with the same groups, and the current screen is highlighted. This replaces the `<details>` summary.
- **Editor tabs** (`AdminTabs`): kept. On overflow, show an edge fade plus a "⋯" menu holding the hidden tabs. The current tab is always visible.
- **Breadcrumbs**: group › screen › object (mono code). On phone, a back link only.

### Status chips: `AdminStatus` / `AdminChip`
Tones and token pairs, always as icon + text:
- neutral: `surface-strong` / `text-muted`
- accent: `accent-soft` / `accent-soft-text`
- positive: `verdict-ac-bg` / `verdict-ac`
- caution: `verdict-tle-bg` / `verdict-tle`
- negative: `verdict-wa-bg` / `verdict-wa`
- info: `tag-5-bg` / `tag-5`

Chips are 24 px tall, 12/600, pill-shaped. Fixed vocabulary:
- Problems: Công khai, Riêng tư, Đề xuất.
- Contests: Đang diễn ra, Sắp diễn ra, Đã kết thúc, Riêng tư, Có rating.
- Users: Hoạt động, Bị cấm, Nhân viên, Siêu quản trị.

### Icons
Lucide only, 16 px in tables and chips, 18 px in buttons, stroke 1.75. Decorative icons are `aria-hidden`. No emoji, no text glyphs ("✕", "→", "▸") as icons.

### Motion
Colour and opacity transitions use `--qh-duration-fast` (150 ms). Drawers and sheets enter with translate + fade over 200 ms (`--qh-ease`) and exit over 140 ms. Toasts slide 8 px and fade. Nothing animates layout. Under `prefers-reduced-motion` all durations are 0 (already global in tokens.css).

### Bit in admin
- At most one Bit per page.
- Allowed places: the dashboard greeting (`staff`, hard hat), the empty state of a table (nightcap) and the 404 inside admin.
- Never in page headers, notices or beside every card title. Never `position:absolute` over the shell.
- It removes the 3-Bit "community" podium from users, organizations, quotas and tickets.

### Copy rules
- No permission codenames, HTTP methods or routes in visible text. A locked control reads "Cần quyền quản lý Polygon"; superusers get the codename in a tooltip.
- Leads are one sentence. Explanations go into `AdminNotice` details or field helper text.

## Component inventory

| Component | Decision |
|---|---|
| `ui/AdminPageHeader.vue` | **Keep**, and add an `overflow` slot or menu plus the phone back link |
| `ui/AdminTabs.vue` | **Keep**, and add overflow fade + "⋯" menu, plus sticky-in-editor-header mode |
| `ui/AdminFilterTabs.vue` | **Keep** as the segmented control, fixing the clipping at 390 (wrap to a select under 360 px). **Merge** `ADMIN_TOGGLE_CLASS` (2 users) into it |
| `ui/classes.ts` | **Replace** with `ui/controls.ts` (button variants primary, secondary, ghost, danger, plus size `sm` / `md`; inputs at the density tokens). Stop importing `features/account/settings/buttons` |
| `ui/AdminField.vue`, `AdminSwitch.vue` | **Keep**. AdminField gets required and error-replaces-helper; AdminSwitch gets the off-state restyle |
| `ui/UsernameChips.vue`, `OrganizationChips.vue`, `ExactChips.vue` | **Keep** (thin wrappers). Show "Không có ai." only once there is no input focus, and keep the input inline after the chips |
| `ui/AdminStatus.vue` | **Keep**, renamed in use to "save/action status"; add `AdminChip` for the tones above |
| `ui/VerdictChips.vue`, `ADMIN_CHECK_CHIP_CLASS` | **Merge** into one `AdminCheckChips` (verdicts, languages, statuses) |
| `ui/MarkdownField.vue`, `use-render-preview.ts` | **Keep**. Preview becomes a tab toggle on phone and side-by-side on ≥ 1024 |
| `ui/RevealKeyDialog.vue`, `UploadButton.vue`, `AdminUserLabel.vue` | **Keep** |
| `shell/AdminNav.vue`, `admin-nav.ts` | **Keep** the data, **rewrite** the view (collapsible groups, counts, sticky, phone sheet) |
| `shell/AdminBit.vue`, `admin-bit.ts` | **Keep**, reduced to the 3 allowed placements |
| `shell/AdminDashboard.vue` | **Replace** the layout (see below) |
| 4 save bars | **Replace** with `ui/form/AdminSaveBar.vue` |
| `problems/drafts/use-draft-leave-guard.ts` | **Generalise** to `ui/form/use-dirty-guard.ts`; the drafts code uses it |
| `submissions/SubmissionBulkBar.vue`, comments bulk bar, `search/ProblemSearchList` sticky bar | **Replace** with `ui/table/AdminBulkBar.vue` |
| 34 hand-made tables, ~28 pagers | **Replace** per screen PR with `ui/table/AdminDataTable.vue` + `components/NumberedPager.vue` + `components/ScrollRegion.vue` |
| `users/UserLookupCard.vue`, problem/contest "Mã bài → Mở" cards | **Remove**, folded into `AdminFilterBar` search |
| New | `ui/table/{AdminDataTable,AdminBulkBar,AdminRowMenu,AdminFilterBar}.vue`, `ui/form/{AdminFormSection,AdminSaveBar,AdminDateTimeField,use-dirty-guard}`, `ui/feedback/{AdminToast,AdminNotice}.vue`, `ui/AdminDrawer.vue`, `ui/AdminChip.vue`, `ui/admin-density.css` |
| Reuse, do not rebuild | `components/{QueryState,StatePanel,EmptyState,SkeletonBlock,ConfirmDialog,NumberedPager,ScrollRegion,ToolbarSearch,ToolbarSelect,CopyButton}.vue` |

## Per-screen redesign notes

### List pages (one pattern: header → tabs? → AdminFilterBar → AdminDataTable)
- **Problems** (`/admin/problems`, `/admin/problems/deleted`):
  - Header actions: "Tạo bài tập" (primary) and a split "Nhập ▾" (Polygon, .zip).
  - Tabs: Tất cả / Đã xóa.
  - Filter bar: search, segmented Tất cả · Công khai · Riêng tư · Đề xuất, and a popover with Nhóm, Loại, Tác giả.
  - Columns: ☐, Bài (name + code), Trạng thái chip, Nhóm, Tác giả (avatar + name), Điểm (right), Cập nhật (relative), and the row actions "Sửa" + ⋯ (Xem bài, Nhân bản, Xóa).
  - Bulk: Công khai, Ẩn, Đổi nhóm, Xóa.
  - Deleted tab: columns Bài, Xóa lúc, Người xóa, "Còn 20 ngày" chip (caution under 7), and actions Khôi phục + ⋯ Xóa hẳn.
- **Contests**:
  - Same pattern. Filter: Tất cả · Đang diễn ra · Sắp diễn ra · Đã kết thúc; popover with Thẻ, Tổ chức, Rating.
  - Columns: Kỳ thi (name + key), Giai đoạn chip, Thời gian as one line "08/10 15:00 → 18:24 (3 giờ 24 phút)" (mono), Thí sinh (right), and chips Rating / Riêng tư.
  - Phone: card with phase chip and time line.
- **Users** (with the drawer, below):
  - Header actions: "Tạo tài khoản" (primary) and "Vai trò" (secondary).
  - Filter: search (prefix, with an exact-match open row), segmented Tất cả · Hoạt động · Bị cấm, popover with Vai trò and Tổ chức.
  - Columns: Người dùng (avatar, username, display name), Vai trò chip, Trạng thái chip, Tham gia, Truy cập gần nhất (relative, with the exact time in `title`), and action "Sửa".
  - Remove the 3 Bits, the lookup card and the footnote.
- **Submissions**:
  - Filter bar: search for problem/user. A "Trạng thái" popover holds two check-chip groups (QU…PD, AC…RJ) with presets (Mọi IE, Mọi CE, Chưa AC). Language goes in the popover.
  - Table: ID mono, Người nộp, Bài, Kết quả (VerdictBadge), Điểm, Thời gian, Bộ nhớ, Ngôn ngữ, Lúc nộp.
  - Bulk: Chấm lại, Tính lại điểm, Từ chối.
  - The "Chấm lại theo bộ lọc nâng cao" link becomes a header secondary action.
- **Rejudge**: a single form card with the filter summary on the right as a sticky "Sẽ áp dụng cho ~N bài nộp" panel. "Chấm lại các bài nộp này" is primary with a confirm, not a red outline. Recent runs become a table under it.
- **Judges**:
  - A KPI strip (queue, online 3/5, average load, blocked) as one row of 4 stat tiles.
  - Judges as a table: name + room, status chip (Trực tuyến/Đã tắt/Bị chặn), Tải, Ping, Đang chấm, Bản dựng, Ngôn ngữ, IP.
  - Row actions: Tắt/Bật (toggle), and ⋯ (Chặn, Cấp khóa mới, Ngắt, Xóa).
  - Details open in the drawer.
- **Languages**:
  - One `LanguageCoverageNotice` (kit `Notice`, compact) replaces the summary strip and the per-language warnings. Title "N ngôn ngữ cần thêm máy chấm", then one line of keys per kind: those no online judge runs (the notice turns danger) and those only one judge runs (warning). The language and online-judge counts are the table footer.
  - Table: Mã, Bài mới chip, Tên, Đuôi tệp, Máy chấm "5 / 5" + a meter and "n trực tuyến" (not colour alone), and "Máy chạy" ("Xem máy" lists each judge's runtime). Phone: cards.
- **Organizations / quotas / requests**:
  - One screen with AdminTabs Tổ chức · Yêu cầu · Hạn mức (counts in tabs).
  - Quotas: two meters per row (credits, storage) with % text, and caution above 80 %.
  - Remove the Bits.
- **Posts, comments, reports, tickets, canned replies**:
  - Shared moderation table pattern. The row shows the content snippet (2 lines) + location + author.
  - Actions: one visible (Ẩn / Xử lý), the rest in ⋯.
  - Reports become a table with a reason chip, not one card per report.
  - Tickets use the full width, and the status filter becomes a segmented control (not radios).
- **Pages, short links, integrations, types, contest tags, config**:
  - "Create" is a header primary action that opens a drawer/dialog form, instead of a create form stacked above the list.
  - Config: a table inside `ScrollRegion`, with value truncated + "Xem" (fixes the 576 px overflow).
  - Contest tags: the colour picker stays as swatches, with the selected one shown as a ring + check icon.
- **Activity, log**:
  - The filter bar holds User, IP, Đường dẫn and the range segmented control (7 / 30 / 90 ngày).
  - Table plus a "Đang truy cập" side card at ≥ 1280.
  - The long warnings become `AdminNotice`s. "Xóa nhật ký khách" moves to the header ⋯ as a destructive item.
- **Similarity** (runs, pairs, pair): runs and pairs become AdminDataTable (similarity % as a right-aligned mono number with a meter). The pair page keeps its side-by-side diff (it scores well) and just adopts the editor header.

### Problem editor (`/admin/problems/:code/{general,statements,editorial,data,files}`)
- **Sticky editor header**: breadcrumb, title, `hcmus41c` chip, status chip, "Xem bài ↗", and the tabs Thông tin chung · Đề bài · Lời giải · Dữ liệu chấm · Tệp.
- **General**:
  - One form card with sections: Thông tin cơ bản · Giới hạn & điểm · Phân loại · Hiển thị với thí sinh · Người phụ trách · Trạng thái.
  - Section rail at ≥ 1280. AdminSaveBar at the bottom.
  - **Move out**: attachments (already on the Tệp tab), Polygon link (to the Dữ liệu tab, top), Nhân bản (to header ⋯), Vùng nguy hiểm (keep as the last section, collapsed).
  - The language-limits table becomes rows "Python 3 · 4.5 s · 256 MB · Bỏ". Its phone layout gets labels.
  - "Trạng thái" switches (Công khai, Quản lý thủ công, Markup đầy đủ) become checkboxes saved with the form. Publish readiness shows as a checklist notice.
- **Statements**: language segmented control (Tiếng Việt · English (chưa có) · Mô tả gốc). Editor and preview side by side at ≥ 1024, and an Editor/Preview toggle on phone. A per-language save sits in the save bar ("Lưu bản dịch Tiếng Việt").
- **Editorial**: same two-pane layout. The public toggle and the release date share one row.
- **Data**:
  - Sections: Gói dữ liệu (archive, file list as chips, Xem init.yml, Tải zip mới) · Tệp nguồn kèm theo (generator, checker, grader, header as a table with Tải lên/Tải lại/Xóa in ⋯) · Checker và grader · Danh sách test.
  - The test list stays a grid inside ScrollRegion, with sticky first column, row drag handle + up/down buttons (keyboard alternative), and bulk "Đặt điểm" / "Pretest".
- **Files**: three upload tiles (Ảnh trong đề, Đề PDF, Tài liệu kèm). Each shows the current file name/size, a Thay, Xóa or Sao chép URL button, and drag-and-drop.
- **New, import, polygon**:
  - New is the same form as General, without the moved-out parts.
  - Polygon is a 3-step stepper with the guide in an `AdminNotice` (collapsed after first use) and the history table below.
  - Zip import is a full-width form: drop zone, then options in 2 columns.

### Contest editor (`/admin/contests/:key/*`)
- **Editor header**: title, key chip, phase chip, "ICPC · 08/10 13:00 → 17:00 · 214 thí sinh" meta line, and "Xem kỳ thi ↗".
- **Tabs**: Thông tin chung · Bài · Thí sinh · Thông báo · Bảng xếp hạng · Thao tác · Ghost · Dữ liệu, with the overflow ⋯ on phone.
- **General**:
  - Sections Thông tin · Người phụ trách · Thời gian · Thể thức và chấm · Quyền xem và xếp hạng.
  - Thời gian shows a small timeline bar (đăng ký → bắt đầu → đóng băng → kết thúc → khóa chấm) above the date fields, using `AdminDateTimeField`.
  - Thể thức groups its 6 switches as checkboxes in two columns.
  - A right-hand summary rail at ≥ 1280 shows status, counts and quick links.
  - AdminSaveBar at the bottom.
- **Problems**:
  - Table: drag/↑↓ order, Nhãn, Bài (name + code), Điểm (inline number), Từng phần ☐, Pretest ☐, Cắt output, Số lần nộp, and ⋯.
  - The add-by-code search sits above the table.
  - Help text becomes an `AdminNotice`. The save bar is shared.
  - "Chấm lại một bài" moves to the Thao tác tab.
- **Participants**: AdminDataTable with an inline filter bar (search, Loại, Trạng thái), status chips (Hợp lệ/Bị loại), and the action "Quản lý ▾" as a row menu. Header primary: "Thêm lượt tham gia".
- **Actions**:
  - Card list of operations.
  - Each card shows a title, one line, "Chạy được khi …" status, and **one** button.
  - Neutral operations (Tính lại điểm, Chấm lần cuối, Tính rating, Dựng lại replay) are secondary.
  - Freeze and lock are caution. Delete goes to the danger zone at the bottom.
- **Ranking, ghosts, data, announcements**: the two-column card grid is kept and adopts the forms and notices.

### Users and the edit drawer
- The list is described above.
- The **drawer** has:
  - A header with avatar, `tuan_k`, display name, the chips Hoạt động / 2FA / Đang thi, and a close button.
  - Tabs **Hồ sơ** (name, email, about, internal note, organizations, flags), **Bảo mật** (đặt mật khẩu mới, liên kết đặt lại, đặt lại 2FA), **Quyền** (roles, permissions) and **Tài khoản** (đổi tên, then the danger zone with Vô hiệu hóa, Cấm and Mạo danh).
  - The footer save bar applies to the current tab only.
- Keep `data-testid="user-edit-open"`, `user-edit`, `role="dialog"` and the existing field labels.

### Dashboard
- Greeting row with one staff Bit, "Chào minhthu", and the three quick actions.
- "Cần xử lý" strip: queue, judges online, open tickets, reports and org requests. Each is a stat tile linking to its filtered list, with tone when above 0.
- "Gần đây" (recent changes, existing) and "Lối tắt": the 6 most-used screens for this account, without codenames or paths.
- Drop the 15 nav-duplicate cards (the sidebar already has them).

## Migration plan

Rules:
- Every PR is independently shippable, green, and squashed via a PR.
- Shared PRs touch only `src/features/admin/ui/**`, `src/features/admin/shell/**` (S1 only), `src/components/**`, `src/theme/primevue-preset.ts` (S4 only) and `design-system/qhhoj/pages/admin.md`.
- No shared PR touches `admin-routes.ts` or `admin-screens.ts`. Screen PRs own exactly one feature subdirectory plus its `src/i18n/admin/<area>.{vi,en}.json`, and adopt shared components.
- In-flight PRs to wait for or rebase on: **#93** `feat/admin-r2-contests` (contests, contest-tags, search, ui), **#90** `feat/external-judge` (admin-routes, admin-screens, problems, settings) and **#85** `feat/org-self-admin` (organizations).

| # | PR | Owns (files) | Depends on |
|---|---|---|---|
| S0 | docs: admin design page | `design-system/qhhoj/pages/admin.md`, `docs/decisions.md` (1 line) | – |
| S1 | Shell and navigation: sticky collapsible sidebar groups + counts, phone nav sheet, Bit placements, back-link breadcrumb, AdminTabs overflow, AdminPageHeader overflow slot | `shell/**`, `ui/AdminTabs.vue`, `ui/AdminPageHeader.vue`, `ui/admin-density.css` | S0 |
| S2 | Controls and forms: `ui/controls.ts` (replaces `classes.ts`, keeping the old exports as aliases until the screen PRs land), AdminField required/error, AdminSwitch restyle, AdminFormSection, AdminSaveBar, AdminDateTimeField, use-dirty-guard, AdminChip | `ui/controls.ts`, `ui/classes.ts`, `ui/form/**`, `ui/AdminField.vue`, `ui/AdminSwitch.vue`, `ui/AdminChip.vue` | S0 |
| S3 | Tables: AdminDataTable, AdminBulkBar, AdminRowMenu, AdminFilterBar; AdminFilterTabs clipping fix + `ADMIN_TOGGLE_CLASS` merge; AdminCheckChips | `ui/table/**`, `ui/AdminFilterTabs.vue`, `ui/VerdictChips.vue` | S2 |
| S4 | Feedback and overlays: AdminToast (+ `use-admin-mutation` success), AdminNotice, AdminDrawer, dialog preset max-height / scrolling body | `ui/feedback/**`, `ui/AdminDrawer.vue`, `ui/use-admin-mutation.ts`, `src/theme/primevue-preset.ts` | S2 |
| P1 | Problems list + deleted | `problems/ProblemsIndexPage.vue`, `problems/lifecycle/**`, `search/**`, `i18n/admin/problemList.*`, `lifecycle.*` | S3, #93 |
| P2 | Problem editor frame + General + New | `problems/ProblemEditorPage.vue`, `problems/general/**`, `problems/drafts/**`, `problems/problem-tabs.ts`, `i18n/admin/problems.*` | S1, S2, S4, #90 |
| P3 | Problem statements, editorial, data, files | `problems/{statements,editorial,data,files,package}/**`, `i18n/admin/package.*` | P2 |
| P4 | Polygon + zip import, catalogs | `problems/{polygon,import}/**`, `catalogs/**`, `i18n/admin/{polygon,polygonLink,catalogs}.*` | S2, S4 |
| C1 | Contests list + new | `contests/ContestsIndexPage.vue`, `contests/general/ContestCreatePage.vue`, `contest-tags/**`, `i18n/admin/{contests,contestTags}.*` | S3, #93 |
| C2 | Contest editor frame + General | `contests/ContestEditorPage.vue`, `contests/contest-tabs.ts`, `contests/general/**` (minus CreatePage) | C1, S2 |
| C3 | Contest problems, participants, ghosts, announcements | `contests/{problems,participants,ghosts,announcements}/**`, `i18n/admin/ghosts.*` | C2, S3 |
| C4 | Contest actions, ranking, data | `contests/{actions,ranking,data}/**`, `i18n/admin/{contestOps,contestData,contestPublish,contestRules}.*` | C2 |
| U1 | Users list + edit drawer + roles | `users/**`, `i18n/admin/{users,staff,permissions}.*` | S3, S4 |
| U2 | Organizations + quotas + activity | `organizations/**`, `activity/**`, `i18n/admin/{organizations,quota,activity}.*` | S3, #85 |
| J1 | Judges + languages | `judges/**`, `languages/**`, `i18n/admin/{judges,languages}.*` | S3, S4 |
| J2 | Submissions, rejudge, similarity | `submissions/**`, `rejudge/**`, `similarity/**`, `i18n/admin/{submissions,rejudge,similarity}.*` | S3 |
| K1 | Moderation: posts, comments, reports, tickets, canned | `posts/**`, `comments/**`, `tickets/**`, `canned-replies/**`, `i18n/admin/{posts,postEditor,comments,tickets,cannedReplies}.*` | S3, S4 |
| W1 | Site: settings, config, pages, log, short links, integrations | `settings/**`, `site/**`, `pages/**`, `short-links/**`, `integrations/**`, `i18n/admin/{settings,site,pages,shortlinks,integrations}.*` | S2, S4, #90 |
| D1 | Dashboard | `shell/AdminDashboard.vue`, `shell/overview/**`, `shell/recent/**`, `i18n/admin/shell.*` | S1 (same dir: lands after S1) |

Parallelism:
- S1 and S2 run in parallel. S3 and S4 follow S2.
- After that, every P, C, U, J, K and W row can run in parallel, except chains inside an area (P2 → P3, C1 → C2 → C3/C4).
- Remove `ui/classes.ts` aliases in the last screen PR to land.

Test hooks every screen PR must keep (the agent-run UI scripts find elements by these):
- `data-testid` values (`user-edit-open`, `user-edit`, `admin-bit`, `audit-entry`, `admin-recent-changes`, `problem-package`, `publish-card`, `tag-editor`, `integration-table`, `short-link-form`, `revisions`, …).
- Element ids (`#contest-section-info`, `#contest-add-problem`, `#contest-*` fields, `#tag-contests-add`, `#announcement-*`).
- `tr[data-code]` on problem rows (the card fallback renders `data-code` on the card too).
- `getByRole('dialog')` on drawers.
- `?sort=`, `?view=`, `?user=` query keys.
- Aria-labels like "Xóa checker.cpp" and "Về mặc định 50".

Per memory: UI-only PRs need no new tests, but the touched specs must stay green.
