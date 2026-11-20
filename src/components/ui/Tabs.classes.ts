/**
 * The class recipes of `Tabs` ("Sơn mài" controls): underline only, never boxes. A row of text tabs on one hairline, 24 px apart; the
 * current tab is ink text with a 2 px brand bar under it (the sliding indicator), the others muted text. `pill` is an old name of
 * the same row. `rail` is that row on a phone and, from `lg`, a side menu whose current item takes the "you are here" cue of the
 * site menu: the soft brand ground, brand text and a 3 px brand bar.
 */
export type TabsVariant = 'pill' | 'underline' | 'rail';

const ROW_FRAME = 'flex border-b border-line-strong';
export const TABS_FRAME: Record<TabsVariant, string> = {
  pill: ROW_FRAME,
  underline: ROW_FRAME,
  rail: `${ROW_FRAME} lg:w-56 lg:shrink-0 lg:border-b-0`,
};

/**
 * The scroll frame. With the "⋯" menu the strip does not scroll by hand: a tab that does not fit is hidden whole and
 * listed in the menu. A tab draws its focus ring inside its own box, so the frame clips nothing.
 */
export function tabsScroller(variant: TabsVariant, hasMenu: boolean): string {
  // `relative` makes the strip the tabs' offsetParent, so their offsetLeft is measured against its scroll position.
  const scroll = `relative ${hasMenu ? 'overflow-x-hidden' : 'overflow-x-auto'}`;
  return variant === 'rail' ? `${scroll} lg:overflow-visible` : scroll;
}

const ROW_LIST = 'flex min-w-max gap-6';
const LIST: Record<TabsVariant, string> = {
  pill: ROW_LIST,
  underline: ROW_LIST,
  rail: `${ROW_LIST} lg:min-w-0 lg:flex-col lg:gap-1`,
};
/**
 * With the menu the list keeps room at its end for the "⋯" button (icon, "Thêm" and a gap, under 96 px), so the last tab can
 * scroll clear of it and the button's showing never changes a measured size.
 */
const MENU_ROOM: Record<TabsVariant, string> = {
  pill: 'pe-24',
  underline: 'pe-24',
  rail: 'pe-24 lg:pe-0',
};

export const tabsList = (variant: TabsVariant, hasMenu: boolean) =>
  hasMenu ? `${LIST[variant]} ${MENU_ROOM[variant]}` : LIST[variant];

/** A tab: one control tall, ink text while current. */
const ROW_TAB = 'min-h-(--qh-control) aria-[current=page]:text-content aria-selected:text-content';
/** The side menu item of `rail` from `lg`. */
const SIDE_TAB =
  'lg:flex-1 lg:rounded-control lg:border-l-3 lg:border-transparent lg:px-(--qh-control-px-sm) lg:not-aria-[current=page]:not-aria-selected:hover:bg-surface-strong lg:aria-[current=page]:border-accent lg:aria-[current=page]:bg-accent-soft lg:aria-[current=page]:text-accent-soft-text lg:aria-selected:border-accent lg:aria-selected:bg-accent-soft lg:aria-selected:text-accent-soft-text';

export const TAB_CLASS: Record<TabsVariant, string> = {
  pill: ROW_TAB,
  underline: ROW_TAB,
  rail: `${ROW_TAB} ${SIDE_TAB}`,
};

/** The sliding indicator: the 2 px brand bar under the current tab (`useSlidingIndicator` in bar mode). */
const TAB_BAR = 'pointer-events-none absolute top-0 left-0 bg-accent';
export const TAB_INDICATOR: Record<TabsVariant, string> = {
  pill: TAB_BAR,
  underline: TAB_BAR,
  rail: `${TAB_BAR} lg:hidden`,
};

export const TAB_BASE =
  'relative inline-flex items-center gap-2 text-body font-semibold whitespace-nowrap text-muted -outline-offset-2 transition-colors hover:text-content';

/** A count after a tab's label: a mono numeral, never a pill. `accent` says something waits for the viewer. */
export const TAB_COUNT = {
  neutral: 'font-mono text-kbd text-muted tabular-nums',
  accent: 'font-mono text-kbd font-bold text-accent-text tabular-nums',
} as const;

/** The "⋯" button sits over the strip's right end, centred on the row. */
const MORE = 'absolute top-1/2 right-0 -translate-y-1/2';
export const MORE_CLASS: Record<TabsVariant, string> = { pill: MORE, underline: MORE, rail: MORE };
