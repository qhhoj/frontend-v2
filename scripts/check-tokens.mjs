// `src/api/generated/` is machine-written from the backend contract and skipped.
// Colours live only in src/theme/themes/*.css; everything else uses semantic tokens. Specs are skipped (contrast tests use literal colours).
// Stock radius/shadow class names are rejected too: `@theme` resets them, so they render nothing. So are the stock type sizes `text-lg` ... `text-9xl`,
// which skip the named scale (scripts/stock-utilities.mjs).
// The retired radius roles rounded-tile and rounded-panel are rejected as well (scripts/retired-utilities.mjs).
// So are the bare transitions that also animate transform (scripts/transition-utilities.mjs).
// So is `uppercase` on a table header cell or header recipe (scripts/table-header-case.mjs).
// So is a raw `<h1` outside PageHeader (scripts/page-headings.mjs).
// So is an `<EmptyState>` without its `#action` next step (scripts/empty-actions.mjs).
// So are raw elements, old wrapper imports and retired classes above a file's baseline (scripts/raw-elements.mjs).
// So is a hairline border (`border-line`, `border-line-strong`) on a form control (scripts/control-borders.mjs).
// So are arbitrary sizes, radii and z-indexes (`text-[13px]`, `rounded-[3px]`, `z-[5]`, `z-50`) and the arbitrary token wrappers `accent-[var(--qh-accent)]` and `min-h-[var(--qa-control)]`: use the named steps (scripts/arbitrary-utilities.mjs).
// The exemptions are Bit's sprite palettes (src/mascot/bit-sprite.ts) and the avatar's sprite data (src/mascot/avatar/avatar-sprites.ts):
// image-like data that Bit keeps in every theme.
import { hairlineControlBorders } from './control-borders.mjs';
import { emptyStateOffences } from './empty-actions.mjs';
import { rawHeadings } from './page-headings.mjs';
import { baselineErrors, rawElementOffences, readBaselines } from './raw-elements.mjs';
import { retiredUtilities } from './retired-utilities.mjs';
import { sourceTree } from './source-tree.mjs';
import { stockUtilities } from './stock-utilities.mjs';
import { tableHeaderUppercase } from './table-header-case.mjs';
import { ALLOWED as MOTION, bareTransitions } from './transition-utilities.mjs';
import { ALLOWED, arbitraryUtilities } from './arbitrary-utilities.mjs';

const colourLiteral = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\(/;
const baselines = readBaselines();

/** A finder that reads one line (and the file's path under src/) and answers the offending words. */
const perLine = (find) => (source, rel) =>
  source.split('\n').flatMap((text, index) => {
    const found = find(text, rel);
    return found.length ? [{ line: index + 1, text: found.join(' ') }] : [];
  });

/** Each check reads a whole file and answers `{ line, text }` offences; the first group that has any is reported. */
const CHECKS = [
  {
    message: `Arbitrary size/radius/z-index classes, z-50, accent-[var(...)] and h-[var(--qa-...)] (use text-tiny|caption|meta|sm|base|title|subtitle|section|display|page|stat|hero|score, rounded-<role>, z-<layer>; docs/design-language.md):`,
    find: perLine((line, rel) =>
      arbitraryUtilities(line).filter((name) => !(ALLOWED[rel] ?? []).includes(name)),
    ),
  },
  {
    message: `Stock classes that skip the named scales: the theme resets rounded-lg and shadow-md (they render nothing), and text-xs, text-lg...text-9xl bypass the type scale (use text-caption (add leading-4 for its 16 px line), rounded-cell|row|card|pill|skeleton|control, shadow-glow|float, text-subtitle|section|display|page|stat|hero|score):`,
    find: perLine(stockUtilities),
  },
  {
    message: `Retired radius roles rounded-tile (20 px) and rounded-panel (28 px): use rounded-row for an inset tile, a notice or a menu, rounded-cell for code and fields, rounded-card for a card or a dialog (docs/design-language.md):`,
    find: perLine(retiredUtilities),
  },
  {
    message: `Bare transition, transition-all and transition-transform also animate transform and layout (use transition-colors or transition-opacity; real motion goes in ALLOWED in scripts/transition-utilities.mjs with its reason):`,
    find: perLine((line, rel) => bareTransitions(line).filter((name) => !MOTION[rel]?.[name])),
  },
  {
    message: `Uppercase table header (a header is sentence case, muted, 13 px: text-meta text-muted, the DataTable recipe; docs/design-language.md):`,
    find: tableHeaderUppercase,
  },
  {
    message: `Hairline border on a form control (an input, select or textarea, or a wrapper that shows its focus or checked state, takes border-line-control: 3:1 on its ground, WCAG 1.4.11; docs/design-language.md):`,
    find: hairlineControlBorders,
  },
  {
    message: `Raw <h1> (a page title is the kit PageHeader, one size; a page that cannot use it goes in ALLOWED in scripts/page-headings.mjs with its reason and still takes page-title; docs/design-language.md):`,
    find: rawHeadings,
  },
  {
    message: `EmptyState without a next step (fill its #action slot: "Xóa bộ lọc", "Tạo <đối tượng>" or a way on; a listed file in scripts/empty-actions.mjs leaves the list when it gains one; docs/design-language.md):`,
    find: emptyStateOffences,
  },
  {
    message: `Raw elements, old wrappers and retired classes above the file's count in scripts/raw-element-baseline/<area>.json (a file never gains one: use the kit part named on each line; a fixed file lowers its count with npm run raw-elements:shrink; docs/wrapper-migration.md):`,
    find: (source, rel) => rawElementOffences(source, rel, baselines.merged[rel]),
  },
  {
    message: `Colour literals outside src/theme/themes/ (use a --qh- token):`,
    find: perLine((line) => (colourLiteral.test(line) ? [line.trim()] : [])),
  },
];

const sources = sourceTree();

for (const { message, find } of CHECKS) {
  const offences = sources.flatMap(({ rel, source }) =>
    find(source, rel).map(({ line, text }) => `src/${rel}:${line}: ${text}`),
  );
  if (offences.length) {
    console.error(`${message}\n${offences.join('\n')}`);
    process.exit(1);
  }
}

const strayEntries = baselineErrors(
  baselines,
  sources.map(({ rel }) => rel),
);
if (strayEntries.length) {
  console.error(`Stale entries in scripts/raw-element-baseline/:\n${strayEntries.join('\n')}`);
  process.exit(1);
}
