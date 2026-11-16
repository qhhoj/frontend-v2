/**
 * Card recipes (docs/design-language.md, Kit 2 spec §3 and §5). A surface is told apart by tone, never by a line. `glass` is the page card:
 * the L1 surface, 12 px corners (the name is older than Kit 2). `inset` is a strong-surface tile inside a card, 8 px corners. `flat` is the
 * admin form and table card, now the same L1 surface. `plain` has no chrome: one section inside a card that another part draws (the blog rail).
 */
export const CARD_VARIANTS = {
  glass: 'glass rounded-card',
  inset: 'rounded-row bg-surface-strong',
  flat: 'rounded-card bg-surface',
  plain: '',
} as const;

export type CardVariant = keyof typeof CARD_VARIANTS;

/** Card padding: one surface value, 20 px (`--qh-pad-surface`); `sm` and `lg` are deprecated aliases of `md`. Unset, the caller pads the card itself. */
export const CARD_PADDING = {
  sm: 'p-(--qh-pad-surface)',
  md: 'p-(--qh-pad-surface)',
  lg: 'p-(--qh-pad-surface)',
} as const;

export type CardPadding = keyof typeof CARD_PADDING;
