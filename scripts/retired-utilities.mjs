// Role radii retired from the scale (docs/design-language.md): `rounded-tile` (20 px) and `rounded-panel` (28 px) sat between the roles.
// An inset tile, a notice or a menu is `rounded-row` (16), a code box or an input `rounded-cell` (12), a card or a dialog `rounded-card` (24).
import { classTokens, utilityOf } from './class-tokens.mjs';

const RETIRED = /^rounded(?:-(?:[tblrse]|tl|tr|bl|br|ss|se|ee|es))?-(?:tile|panel)$/;

/** The retired radius classes used in the string literals of one source line, without their variants; comment lines are ignored. */
export const retiredUtilities = (line) =>
  classTokens(line)
    .map(utilityOf)
    .filter((name) => RETIRED.test(name));
