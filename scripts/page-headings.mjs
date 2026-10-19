// A page's h1 is the kit `PageHeader` (one size, the `page-title` step; docs/design-language.md, Rules). So no raw `<h1` in a .vue file outside
// PageHeader. A page that cannot use the header (a centred error state, the auth card, a print sheet) is listed in ALLOWED with the reason, and its
// h1 still takes the `page-title` class: the size stays one.
import { classTokens } from './class-tokens.mjs';

const PAGE_HEADER = 'components/ui/PageHeader.vue';
/** An opening h1 tag, over lines; a `>` inside a quoted attribute value does not end it. */
const H1_TAG = /<h1\b(?:"[^"]*"|'[^']*'|[^>"'])*>/g;

/** Known exceptions, by file (path under src/) and the reason the page does not use PageHeader. */
export const ALLOWED = {
  'features/auth/AuthLayout.vue':
    'the title sits inside the auth card, centred on the form, with no crumbs or actions',
  'features/not-found/NotFoundPage.vue': 'a centred error state under the 404 digits and Bit',
  'features/contests/ContestNotFound.vue': 'a centred error state under Bit',
  'features/admin/shell/AdminForbidden.vue': 'a centred error state under Bit',
  'features/admin/shell/AdminPlaceholder.vue': 'a centred placeholder state under Bit',
  'features/admin/similarity/SimilarityPairPage.vue': 'a centred not-found state under Bit',
  'features/home/AnonymousHero.vue':
    'the signed-out hero card: title, pitch and calls to action beside Bit',
  'features/profile/ProfileHeader.vue':
    'the profile card: the username takes the rating tier colour beside avatar, tier and own chips',
  'features/contests/print/ContestPrintPage.vue':
    'the printed sheet title, centred between rules, not a screen header',
};

const lineOf = (source, index) => source.slice(0, index).split('\n').length;

/** The h1 tags of one file that break the rule, as `{ line, text }`: a raw h1 outside PageHeader and the allowed list, or an allowed one without `page-title`. */
export function rawHeadings(source, rel) {
  if (rel === PAGE_HEADER || !rel.endsWith('.vue')) return [];
  return [...source.matchAll(H1_TAG)].flatMap((match) => {
    const takesPageStep = classTokens(match[0]).includes('page-title');
    if (rel in ALLOWED && takesPageStep) return [];
    return [
      {
        line: lineOf(source, match.index),
        text: rel in ALLOWED ? '<h1> without page-title' : '<h1>',
      },
    ];
  });
}
