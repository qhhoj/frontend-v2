type Messages = { [key: string]: string | Messages };
type AreaFiles = Record<string, { default: Messages }>;

/** `./admin/<area>.<locale>.json` files, merged as `admin.<area>`; a new area file needs no edit here. */
const files = import.meta.glob<{ default: Messages }>('./admin/*.json', {
  eager: true,
}) as AreaFiles;

function areasOf(locale: 'vi' | 'en'): Record<string, Messages> {
  const areas: Record<string, Messages> = {};
  for (const [path, module] of Object.entries(files)) {
    const match = /\/(\w+)\.(vi|en)\.json$/.exec(path);
    if (match?.[2] === locale) areas[match[1]!] = module.default;
  }
  return areas;
}

export const ADMIN_MESSAGES = { vi: areasOf('vi'), en: areasOf('en') };
