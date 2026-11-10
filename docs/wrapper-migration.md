# Wrapper and raw-element migration ledger

The kit (`src/components/ui/`) has a part for every job. A ratchet holds the old ways at the count they had on 2026-11-10
(`5eecc7ca`, after the kit lanes K2-K6). It covers three kinds of use:

- raw template elements;
- imports of the thin wrappers kept for old call sites, and direct PrimeVue parts;
- class words the standard retires.

No file may gain a use, and every fix lowers its count.

- **Rules:** `scripts/raw-element-rules.mjs` holds the element and class rules; `scripts/wrapper-imports.mjs` holds the
  import rules.
- **Baselines:** one file per area, `scripts/raw-element-baseline/<area>.json`. Each is
  `{ "<path under src>": { "<rule>": count } }`. `areaOf` in `scripts/raw-elements.mjs` maps each path to its area.
- **Checks:**
  - `npm run lint:tokens` fails when a file has more uses of a rule than its count (a file not listed has none).
  - It also fails when a file has fewer uses than its count, or when an entry names a missing file or sits in the
    wrong area's file.
  - ESLint (`no-restricted-imports`, built from the same baselines) flags a new wrapper import as you type. A file
    listed for one wrapper is still refused the others.
- **Only shrink:** `scripts/raw-elements.first.json` keeps the first baselines (its hash is pinned).
  `scripts/raw-elements.spec.ts` fails when a baseline holds a file or a count that the first one does not.
- **Not checked:** specs, and the kit itself (raw elements and PrimeVue are its job).
- **Bypasses closed:**
  - tags in any letter case (`<BUTTON>` renders a button);
  - `<component :is="'button'">`;
  - a `>` inside an attribute value;
  - imports matched by the resolved file, whatever the path (`@/`, `../`, `./`, with or without the extension);
  - wrapper uses counted by the names the import binds, so an alias (`import Badge from …AdminChip.vue`) and a
    kebab-case tag (`<badge>`) both count;
  - `*-verdict-*` inside an arbitrary value (`text-(--qh-verdict-ac)`);
  - dynamic `import()` and `export … from`;
  - comments do not count.

  Nothing registers components globally, so a tag reaches a wrapper only through its import. A spec checks that.

## Counts (2026-11-10)

Uses, then files. The last M lane updates this table; the M lanes before it only shrink their baseline file.

### Raw elements

| Rule       | Uses | Files | Use instead                                                       |
| ---------- | ---- | ----- | ----------------------------------------------------------------- |
| `button`   | 279  | 185   | `AppButton` or `IconButton` (an `<input type="submit">` too)      |
| `input`    | 129  | 79    | `TextInput` (numbers too) or `DateTimeField`; a dynamic `:type`   |
| `search`   | 6    | 6     | `SearchInput`                                                     |
| `password` | 9    | 6     | `PasswordInput`                                                   |
| `checkbox` | 39   | 32    | `Checkbox` or `Switch`                                            |
| `radio`    | 26   | 15    | `RadioGroup`, `ChoiceCards` or `SegmentedControl`                 |
| `file`     | 2    | 2     | `UploadButton`                                                    |
| `select`   | 39   | 26    | `SelectField` or `ComboBox`                                       |
| `textarea` | 30   | 26    | `TextArea` or `MarkdownEditor`                                    |
| `table`    | 30   | 29    | `DataTable`                                                       |
| `details`  | 10   | 10    | `Disclosure`                                                      |
| `dialog`   | 1    | 1     | `Modal` or `Drawer`                                               |

`<input type="range">` and `type="hidden"` pass: the kit has no part for them.

### Imports

| Rule                 | Wrapper or module                                 | Uses | Files | Use instead                                              |
| -------------------- | ------------------------------------------------- | ---- | ----- | -------------------------------------------------------- |
| `controls`           | `features/admin/ui/controls.ts`                   | 699 | 203 | `AppButton`/`IconButton`, `TextInput`/`TextArea`/`SelectField`, `Card` |
| `AdminField`         | `features/admin/ui/AdminField.vue`                | 144 | 67 | `FormField` + a kit input                                |
| `AdminChip`          | `features/admin/ui/AdminChip.vue`                 | 88 | 46 | `Chip`                                                   |
| `AdminDataTable`     | `features/admin/ui/table/AdminDataTable.vue`      | 33 | 33 | `DataTable`                                              |
| `AdminPageHeader`    | `features/admin/ui/AdminPageHeader.vue`           | 33 | 33 | `PageHeader`                                             |
| `AdminRowMenu`       | `features/admin/ui/table/AdminRowMenu.vue`        | 29 | 18 | `RowMenu`                                                |
| `AdminNotice`        | `features/admin/ui/feedback/AdminNotice.vue`      | 24 | 21 | `Notice`                                                 |
| `GlassCard`          | `components/GlassCard.vue`                        | 23 | 20 | `Card`                                                   |
| `SettingsNotice`     | `features/account/settings/SettingsNotice.vue`    | 27 | 20 | `Notice`                                                 |
| `use-admin-toast`    | `features/admin/ui/feedback/use-admin-toast.ts`   | 18 | 18 | `useToast` (`components/ui/use-toast`)                   |
| `AdminUserLabel`     | `features/admin/ui/AdminUserLabel.vue`            | 18 | 17 | `UserLink`                                               |
| `SettingsCard`       | `features/account/settings/SettingsCard.vue`      | 19 | 17 | `Card`                                                   |
| `AuthField`          | `features/auth/AuthField.vue`                     | 17 | 15 | `FormField` + `TextInput` or `PasswordInput`             |
| `primevue`           | `primevue/*` (not `config`, not `menuitem` types) | 20 | 14 | `Modal`/`ConfirmDialog`, `Menu`/`RowMenu`, `Drawer`, `Popover`, `ComboBox` |
| `AdminDateTimeField` | `features/admin/ui/form/AdminDateTimeField.vue`   | 15 | 11 | `DateTimeField scale="admin"`                            |
| `AdminDrawer`        | `features/admin/ui/AdminDrawer.vue`               | 8 | 8 | `Drawer`                                                 |
| `CommunityCard`      | `features/community/CommunityCard.vue`            | 5 | 5 | `Card` + `QueryState`                                    |
| `AdminChoiceCards`   | `features/admin/ui/form/ChoiceCards.vue`          | 4 | 4 | `ChoiceCards` (`components/ui`)                          |
| `PillTabs`           | `components/PillTabs.vue`                         | 9 | 3 | `Tabs`                                                   |
| `SubmissionPager`    | `features/submissions/SubmissionPager.vue`        | 3 | 3 | `NumberedPager`                                          |
| `AuthNotice`         | `features/auth/AuthNotice.vue`                    | 3 | 2 | `Notice`                                                 |
| `AuthSelect`         | `features/auth/AuthSelect.vue`                    | 2 | 1 | `FormField` + `SelectField`                              |
| `admin-toasts`       | `features/admin/ui/feedback/admin-toasts.ts`      | 0 | 0 | `components/ui/toasts`                                   |

A use is each reference to a name the import binds: a tag in either case (`<Badge>`, `<badge>`), a class constant, a
type. An import whose names are unused counts once, as does each dynamic import or re-export. When the last importer of a
wrapper moves to the kit, delete the wrapper and its rule.

Not restricted, because they add behaviour the kit part lacks:

- `AdminSwitch` and `AdminCheckbox` add `lockedBy`.
- `MarkdownField` adds the staff preview call.
- `UsernameChips` and `OrganizationChips` add the lookups over `ChipPicker`.
- `ToolbarSelect` is a native select dressed as a toolbar button, with no kit equal yet.
- `button-classes.ts` is the kit's own recipe, for a link that looks like a button.

### Classes

| Rule               | Uses | Files | Use instead                                                                  |
| ------------------ | ---- | ----- | ---------------------------------------------------------------------------- |
| `verdict-tone`     | 77   | 31    | the status tones (`positive-bg`, `negative-bg`, success/danger/warning)      |
| `fixed-size`       | 75   | 38    | the size steps (icons `size-3.5/4/5`, controls `min-h-(--qh-control)`); a skeleton copies the real markup |
| `uppercase`        | 25   | 19    | sentence case, `text-caption font-semibold`                                  |
| `disabled-opacity` | 2    | 2     | the kit control's muted disabled pair (`AppButton disabledReason`)           |

- `fixed-size` is `size-`, `h-` or `min-h-` with a `[N px|rem]` value.
- `verdict-tone` is any `*-verdict-*` colour outside the verdict parts. Those parts are listed in `VERDICT_PARTS` and
  draw a submission's result or the viewer's solved state.

### Areas

| Baseline file                | M lane | Uses | Files |
| ---------------------------- | ------ | ---- | ----- |
| `problems-submissions.json`  | M-PS   | 41 | 29 |
| `contests.json`              | M-CT   | 44 | 27 |
| `shell-home.json`            | M-SH   | 38 | 19 |
| `auth-account.json`          | M-AU   | 99 | 40 |
| `profile-notifications.json` | M-PR   | 34 | 14 |
| `blog-comments.json`         | M-BC   | 34 | 16 |
| `organizations-tickets.json` | M-OT   | 69 | 37 |
| `admin-problems.json`        | M-AP   | 380 | 71 |
| `admin-tools.json`           | M-AT   | 115 | 34 |
| `admin-contests-users.json`  | M-A2a  | 503 | 74 |
| `admin-site.json`            | M-A2b  | 403 | 63 |
| `admin-moderation.json`      | M-A2c  | 236 | 35 |
| `shared.json`                | any    | 24 | 7 |

`shared.json` covers every path no area claims, such as `src/components` outside the kit and `src/lib` (today seven files in `src/components`).
Whichever lane edits one of those files lowers its count.

## How to migrate a file

1. Swap the raw element, wrapper or class for the kit part the lint line names, keeping props and markup otherwise.
2. Run `npm run raw-elements:shrink`. It rewrites the baseline files down to the real counts and never raises or adds
   one. Commit the lowered `<area>.json` with the fix. `npm run lint:tokens` fails until you do.
3. Leave this document's counts to the last M lane.

A moved or split file starts with no counts: move its uses to the kit in the same change. Shrink never adds an entry,
and the spec refuses one the first baselines lack.

Never add a file or raise a count, whether in a baseline or in `raw-elements.first.json`: a new file uses the kit.
