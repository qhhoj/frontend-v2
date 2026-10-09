import { translate } from '@/i18n';

export type ConfigKind = 'html' | 'url' | 'tracking' | 'text';
export const CONFIG_VALUE_MAX = 20_000;
export const CONFIG_KEY_PATTERN = /^[^\u0000-\u001f\u007f]{1,30}$/;

export function configKindOf(key: string, value: string): ConfigKind {
  if (key === 'analytics') return 'tracking';
  if (/_(link|url)$/.test(key)) return 'url';
  return value.trimStart().startsWith('<') ? 'html' : 'text';
}

export function checkConfigValue(kind: ConfigKind, value: string): string | null {
  if (value.length > CONFIG_VALUE_MAX) return translate('admin.site.config.errors.tooLong');
  if (kind === 'url' && value !== '' && !/^https?:\/\//.test(value))
    return translate('admin.site.config.errors.url');
  return null;
}

const PREVIEW_POLICY = "default-src 'none'; style-src 'unsafe-inline'; img-src data:";

/** For `<iframe sandbox="" srcdoc>`: no scripts, no forms, no navigation, no remote loads besides https images. */
export const previewDocument = (html: string) =>
  `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${PREVIEW_POLICY}"></head><body>${html}</body></html>`;
