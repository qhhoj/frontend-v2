/**
 * The class recipes of `Tabs`, per look. `underline` is the Workbench tab row (directions.md §2: a 2 px accent underline under
 * the current tab, no fill); `pill` is a row of quiet 28 px boxes; `rail` is the pill row on a phone and a side nav from `lg`.
 */
export type TabsVariant = 'pill' | 'underline' | 'rail';

export const TABS_FRAME: Record<TabsVariant, string> = {
  pill: 'flex',
  underline: 'relative flex items-end border-b border-line',
  rail: 'flex lg:w-56 lg:shrink-0 lg:rounded-card lg:border lg:border-line lg:bg-surface lg:p-1.5',
};

/**
 * The scroll frame. With the "⋯" menu the strip does not scroll by hand: a tab that does not fit is hidden whole and
 * listed in the menu. The pill strip's padding and negative margin leave room for the focus ring the frame would clip.
 */
export function tabsScroller(variant: TabsVariant, hasMenu: boolean): string {
  // `relative` makes the strip the tabs' offsetParent, so their offsetLeft is measured against its scroll position.
  const scroll = `relative ${hasMenu ? 'overflow-x-hidden' : 'overflow-x-auto'}`;
  if (variant === 'underline')
    return `${scroll} [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`;
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

/** A boxed tab: the accent-soft pair while current. */
const PILL_TAB =
  'min-h-(--qh-control) rounded-control border border-transparent px-2.5 hover:bg-surface-hover aria-[current=page]:border-accent aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent-soft-text aria-selected:border-accent aria-selected:bg-accent-soft aria-selected:text-accent-soft-text';

export const TAB_CLASS: Record<TabsVariant, string> = {
  pill: PILL_TAB,
  underline:
    '-mb-px min-h-(--qh-control) border-b-2 border-transparent px-2.5 focus-visible:-outline-offset-2 aria-[current=page]:border-accent aria-[current=page]:text-content aria-selected:border-accent aria-selected:text-content',
  rail: `${PILL_TAB} lg:flex-1`,
};

export const TAB_BASE =
  'inline-flex items-center gap-2 text-meta font-medium whitespace-nowrap text-muted hover:text-content aria-[current=page]:font-semibold aria-selected:font-semibold';

/** The "⋯" button sits over the strip's right end: on the underline's baseline, or centred on the pill row. */
export const MORE_CLASS: Record<TabsVariant, string> = {
  pill: 'absolute top-1/2 right-0 -translate-y-1/2',
  underline: 'absolute right-0 bottom-1',
  rail: 'absolute top-1/2 right-0 -translate-y-1/2',
};
