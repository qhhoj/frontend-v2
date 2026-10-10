/** What a post's list card shows, derived from the backend-sanitized `summaryHtml`: a plain-text excerpt and the first image. */

const EXCERPT_LENGTH = 220;
/** Parts of a summary that are not running prose: headings, code, scripts, styles and embedded media. */
const NON_PROSE = 'h1,h2,h3,h4,h5,h6,pre,script,style,img,figure,table,iframe,svg';
const BLOCKS = 'p,li,div,br,blockquote,ul,ol';
const MEDIA_PATHS = ['/media/', '/martor/'];

const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');

/** Plain text of the summary's prose: no tags, no headings, no code, whitespace collapsed, cut at a word. */
export function summaryExcerpt(html: string): string {
  const body = parse(html).body;
  body.querySelectorAll(NON_PROSE).forEach((node) => node.remove());
  body.querySelectorAll(BLOCKS).forEach((node) => node.append(' '));
  const text = (body.textContent ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= EXCERPT_LENGTH) return text;
  const cut = text.slice(0, EXCERPT_LENGTH);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), EXCERPT_LENGTH / 2))}…`;
}

/** An image address is shown only when it stays on this site: a /media or /martor path, or an absolute URL of this origin. */
function ownImagePath(src: string, origin: string): string | null {
  if (MEDIA_PATHS.some((prefix) => src.startsWith(prefix))) return src;
  try {
    const url = new URL(src, origin);
    const isOwn =
      url.origin === origin && MEDIA_PATHS.some((prefix) => url.pathname.startsWith(prefix));
    return isOwn ? `${url.pathname}${url.search}` : null;
  } catch {
    return null;
  }
}

/** The first `<img>` of the summary whose source is ours, else null. */
export function summaryFirstImage(html: string, origin = window.location.origin): string | null {
  for (const image of parse(html).querySelectorAll('img')) {
    const path = ownImagePath(image.getAttribute('src')?.trim() ?? '', origin);
    if (path) return path;
  }
  return null;
}
