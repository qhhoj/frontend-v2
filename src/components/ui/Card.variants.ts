/**
 * Card recipes ("Sơn mài" controls): one card style. `glass` (the name is older than the look) and `flat` are that card: the surface,
 * a 1 px line, 6 px corners. `inset` is a raised tile nested in a card (4 px corners, no line). `plain` has no chrome: one section
 * inside a card that another part draws (the blog rail).
 */
export const CARD_VARIANTS = {
  glass: 'glass rounded-card',
  inset: 'rounded-row bg-surface-strong',
  flat: 'glass rounded-card',
  plain: '',
} as const;

export type CardVariant = keyof typeof CARD_VARIANTS;

/** Card padding: one value, 16 px (`--qh-pad-surface`); `sm` and `lg` are old names of `md`. Unset, the caller pads the card itself. */
export const CARD_PADDING = {
  sm: 'p-(--qh-pad-surface)',
  md: 'p-(--qh-pad-surface)',
  lg: 'p-(--qh-pad-surface)',
} as const;

export type CardPadding = keyof typeof CARD_PADDING;
