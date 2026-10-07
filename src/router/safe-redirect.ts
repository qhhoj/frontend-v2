const FALLBACK = '/';

/**
 * The `redirect` query is user-controlled, so only same-origin paths pass: one leading `/`, no `//` or `/\`
 * (protocol-relative after browser normalisation), no backslash or control character anywhere. Anything else,
 * including arrays and absolute or `javascript:` URLs, becomes `/`.
 */
export function safeRedirect(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/')) return FALLBACK;
  if (value.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(value)) return FALLBACK;
  return value;
}
