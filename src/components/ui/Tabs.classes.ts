/**
 * The class recipes of `Tabs`, per look (Kit 2, spec §5): no track and no underline. Each tab is a 36 px pill with 15 px text; the current
 * tab is filled with the strong surface (L2) and semibold, the others are muted text that fills on hover. `underline` is the old
 * name of the default look and now draws the same pill row (deprecated, DESIGN.md); `rail` is the pill row on a phone and a side nav from `lg`.
 */
export type TabsVariant = 'pill' | 'underline' | 'rail';

export const TABS_FRAME: Record<TabsVariant, string> = {
  pill: 'flex',
  underline: 'flex',
  rail: 'flex lg:w-56 lg:shrink-0 lg:rounded-card lg:bg-surface lg:p-1.5',
};

/**
 * The scroll frame. With the "⋯" menu the strip does not scroll by hand: a tab that does not fit is hidden whole and
 * listed in the menu. The strip's padding and negative margin leave room for the focus ring the frame would clip.
 */
export function tabsScroller(variant: TabsVariant, hasMenu: boolean): string {
  // `relative` makes the strip the tabs' offsetParent, so their offsetLeft is measured against its scroll position.
  const scroll = `relative ${hasMenu ? 'overflow-x-hidden' : 'overflow-x-auto'}`;
  const frame = `-m-1 ${scroll} p-1`;
  return variant === 'rail' ? `${frame} lg:m-0 lg:overflow-visible lg:p-0` : frame;
}

const LIST: Record<TabsVariant, string> = {
  pill: 'flex min-w-max gap-1',
  underline: 'flex min-w-max gap-1',
  rail: 'flex min-w-max gap-1 lg:min-w-0 lg:flex-col',
};
/**
 * With the menu the list keeps room at its end for the "⋯" button (icon, "Thêm" and a 4 px gap, under 96 px), so the last tab can
 * scroll clear of it and the button's showing never changes a measured size.
 */
const MENU_ROOM: Record<TabsVariant, string> = {
  pill: 'pe-24',
  underline: 'pe-24',
  rail: 'pe-24 lg:pe-0',
};

export const tabsList = (variant: TabsVariant, hasMenu: boolean) =>
  hasMenu ? `${LIST[variant]} ${MENU_ROOM[variant]}` : LIST[variant];

/** A pill tab: full-contrast text while current; its L2 pill is the sliding indicator behind it. */
const PILL_TAB =
  'min-h-(--qh-control) rounded-control px-(--qh-control-px-sm) not-aria-[current=page]:not-aria-selected:hover:bg-surface-hover aria-[current=page]:text-content aria-selected:text-content';

export const TAB_CLASS: Record<TabsVariant, string> = {
  pill: PILL_TAB,
  underline: PILL_TAB,
  rail: `${PILL_TAB} lg:flex-1`,
};

/** The sliding indicator, behind the tabs: the current tab's strong-surface pill. */
const TAB_PILL_INDICATOR =
  'edge-high pointer-events-none absolute top-0 left-0 rounded-control bg-surface-strong';
export const TAB_INDICATOR: Record<TabsVariant, string> = {
  pill: TAB_PILL_INDICATOR,
  underline: TAB_PILL_INDICATOR,
  rail: TAB_PILL_INDICATOR,
};

export const TAB_BASE =
  'relative inline-flex items-center gap-2 text-body font-medium whitespace-nowrap text-muted hover:text-content aria-[current=page]:font-semibold aria-selected:font-semibold';

/** The "⋯" button sits over the strip's right end, centred on the row. */
export const MORE_CLASS: Record<TabsVariant, string> = {
  pill: 'absolute top-1/2 right-0 -translate-y-1/2',
  underline: 'absolute top-1/2 right-0 -translate-y-1/2',
  rail: 'absolute top-1/2 right-0 -translate-y-1/2',
};
