// Tailwind's stock utilities that bypass the named scales (docs/design-language.md).
// Radius and shadow: `@theme` resets `--radius-*` and `--shadow-*`, so these generate no CSS and the element renders square or flat.
// Type size: `text-xs` and `text-lg` ... `text-9xl` still render, but the scale is text-tiny|caption|meta|sm|base|title|subtitle|section|display|page|stat|hero|score.
// The project's role names (rounded-cell, rounded-pill, shadow-glow, text-section, ...) are not matched.
import { classTokens, utilityOf } from './class-tokens.mjs';

const STOCK =
  /^(?:rounded(?:-(?:[tblrse]|tl|tr|bl|br|ss|se|ee|es))?(?:-(?:xs|sm|md|lg|xl|2xl|3xl))?|shadow(?:-(?:xs|sm|md|lg|xl|2xl))?|text-(?:xs|lg|xl|[2-9]xl)(?:\/\S+)?)$/;

/** The stock class names used in the string literals of one source line, without their variants; comment lines are ignored. */
export const stockUtilities = (line) =>
  classTokens(line)
    .map(utilityOf)
    .filter((name) => STOCK.test(name));
