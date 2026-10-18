# Wrapper migration ledger

Thin wrappers over the `src/components/ui/` kit are kept only for the call sites that already use them. ESLint (`no-restricted-imports`, rule data in `scripts/wrapper-imports.mjs`) rejects any new import of them; the files that import one today are the allow-list in that file (278 files, counted 2026-10-18 at `d4bc7177`).

## Ledger

Counts are importing files, specs included; the bracket is how many of them are specs.

| Wrapper                                                               | Files  | Replace with                                                           |
| --------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------- |
| `features/admin/ui/controls.ts` (`buttonClass`, `INPUT`, `CARD`, ...) | 216    | `AppButton`/`IconButton`, `TextInput`/`TextArea`/`SelectField`, `Card` |
| `features/admin/ui/AdminField.vue`                                    | 69 (1) | `FormField` + a kit input                                              |
| `features/admin/ui/AdminChip.vue`                                     | 47     | `Chip`                                                                 |
| `features/admin/ui/table/AdminDataTable.vue`                          | 34 (1) | `DataTable`                                                            |
| `features/admin/ui/AdminPageHeader.vue`                               | 33     | `PageHeader`                                                           |
| `features/admin/ui/feedback/AdminNotice.vue`                          | 23     | `Notice`                                                               |
| `components/GlassCard.vue`                                            | 22 (1) | `Card`                                                                 |

A file that imports several wrappers is counted once per wrapper; the allow-list holds 278 distinct files.

The `controls.ts` module is restricted as a whole. Three of its classes have no kit equal yet (`CHECK_CHIP`, `TOGGLE`, `OVERFLOW_ITEM`: no chip checkbox, toggle button or menu item), so a new use of one first needs the kit part. Not restricted: `settings/buttons.ts`, `AdminSwitch` (the kit `Switch` plus `lockedBy`), `PillTabs`, `Settings*` and `Auth*`.

## How to migrate a file

1. Swap the wrapper for the kit part in the table, keeping props and markup otherwise.
2. Remove the file from `WRAPPER_IMPORTERS` in `scripts/wrapper-imports.mjs`. `scripts/wrapper-imports.spec.ts` fails while a listed file no longer imports a wrapper, so a migrated file cannot stay on the list.
3. Lower the count here.

Never add a file to the list: a new file imports the kit.
