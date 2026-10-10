/** What a post's list card shows, derived from the backend-sanitized `summaryHtml`: a plain-text excerpt and the first image. */
import { htmlExcerpt } from '@/lib/html-excerpt';

const EXCERPT_LENGTH = 220;
const MEDIA_PATHS = ['/media/', '/martor/'];

const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');

/** Plain text of the summary's prose: no tags, no headings, no code, whitespace collapsed, cut at a word. */
export const summaryExcerpt = (html: string): string => htmlExcerpt(html, EXCERPT_LENGTH);

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
