/** Parts of sanitized HTML that are not running prose: headings, code, scripts, styles, embedded media and KaTeX's MathML twin (its text repeats the visible formula). */
const NON_PROSE = 'h1,h2,h3,h4,h5,h6,pre,script,style,img,figure,table,iframe,svg,.katex-mathml';
const BLOCKS = 'p,li,div,br,blockquote,ul,ol';

/** Plain text of backend-sanitized HTML's prose: no tags, no headings, no code, whitespace collapsed, cut at a word after `maxLength`. */
export function htmlExcerpt(html: string, maxLength: number): string {
  const body = new DOMParser().parseFromString(html, 'text/html').body;
  body.querySelectorAll(NON_PROSE).forEach((node) => node.remove());
  body.querySelectorAll(BLOCKS).forEach((node) => node.append(' '));
  const text = (body.textContent ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), maxLength / 2))}…`;
}
