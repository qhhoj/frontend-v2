export type Messages = { [key: string]: string | Messages };
type AreaFiles = Record<string, { default: Messages }>;
export type AdminMessages = Record<'vi' | 'en', Record<string, Messages>>;

/** `<area>.<locale>.json` files, keyed by locale then area (merged as `admin.<area>`). */
export function areasOf(files: AreaFiles): AdminMessages {
  const messages: AdminMessages = { vi: {}, en: {} };
  for (const [path, module] of Object.entries(files)) {
    const match = /\/(\w+)\.(vi|en)\.json$/.exec(path);
    if (match) messages[match[2] as 'vi' | 'en'][match[1]!] = module.default;
  }
  return messages;
}

/**
 * `./admin/shared/`: the admin areas that pages outside the admin area also show (through admin parts they import).
 * They load with the app. Every other area in `./admin/` loads when an admin page is first opened
 * (`loadAdminMessages`); `admin-messages.guard.spec.ts` fails when a public page reaches one of those.
 */
export const SHARED_ADMIN_MESSAGES = areasOf(
  import.meta.glob<{ default: Messages }>('./admin/shared/*.json', { eager: true }) as AreaFiles,
);
