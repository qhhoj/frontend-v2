/**
 * Card recipes (docs/design-language.md). `glass` is the page card: the theme decides whether it is a white hairline card
 * (Clay) or frosted (Glass). `inset` is a tinted tile inside a card. `flat` is the admin form and table card.
 */
export const CARD_VARIANTS = {
  glass: 'glass rounded-card',
  inset: 'rounded-row bg-surface-strong',
  flat: 'rounded-row border border-line bg-surface',
} as const;

export type CardVariant = keyof typeof CARD_VARIANTS;

/** Card padding 16/20/24 px. Unset, the caller pads the card itself. */
export const CARD_PADDING = { sm: 'p-4', md: 'p-5', lg: 'p-6' } as const;

export type CardPadding = keyof typeof CARD_PADDING;
