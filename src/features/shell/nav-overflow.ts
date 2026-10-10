/** Classes shared by the visible nav items and the hidden copies that are measured, so both have the same width. */
export const NAV_ITEM_CLASS =
  'inline-flex min-h-11 items-center rounded-pill px-2 text-sm whitespace-nowrap sm:px-4 sm:text-base';

export interface NavSplit {
  /** Indexes of the items shown in the bar, in order. */
  visible: number[];
  /** Indexes of the items that moved into the "More" menu, in order. */
  hidden: number[];
}

export interface NavSplitInput {
  /** Width of each item as laid out in the bar. */
  widths: number[];
  /** Room the items (and the "More" button) may take. */
  available: number;
  moreWidth: number;
  gap: number;
  /** The item of the page being viewed, or -1; it never goes into the menu. */
  activeIndex: number;
}

const rowWidth = (widths: number[], gap: number) =>
  widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(widths.length - 1, 0);

/** The count of leading items that fit in `budget`. */
const fittingPrefix = (widths: number[], gap: number, budget: number) => {
  let count = 0;
  while (count < widths.length && rowWidth(widths.slice(0, count + 1), gap) <= budget) count += 1;
  return count;
};

const range = (from: number, to: number) =>
  Array.from({ length: to - from }, (_unused, offset) => from + offset);

/**
 * Decides which nav items stay in the bar. Everything fits: no menu. Otherwise the leading
 * items that fit beside the "More" button stay; when the current page's item would fall
 * into the menu it takes the place of the last item that fits, so it is always in the bar.
 */
export function splitNavItems(input: NavSplitInput): NavSplit {
  const { widths, available, moreWidth, gap, activeIndex } = input;
  const all = range(0, widths.length);
  if (rowWidth(widths, gap) <= available) return { visible: all, hidden: [] };
  const budget = available - moreWidth - gap;
  let count = fittingPrefix(widths, gap, budget);
  let visible = range(0, count);
  if (activeIndex >= count) {
    const activeWidth = widths[activeIndex] ?? 0;
    while (count > 0 && rowWidth(widths.slice(0, count), gap) + gap + activeWidth > budget)
      count -= 1;
    visible = [...range(0, count), activeIndex];
  }
  return { visible, hidden: all.filter((index) => !visible.includes(index)) };
}

/**
 * The scroll position that puts an item of a scrolling strip clear of the fade bands at both
 * ends (the browser clamps it to the strip, where no fade is drawn at the very start or end).
 */
export function scrollToClearFade(item: {
  left: number;
  right: number;
  scrollLeft: number;
  viewWidth: number;
  fadeWidth: number;
}): number {
  const { left, right, scrollLeft, viewWidth, fadeWidth } = item;
  if (left - fadeWidth < scrollLeft) return left - fadeWidth;
  if (right + fadeWidth > scrollLeft + viewWidth) return right + fadeWidth - viewWidth;
  return scrollLeft;
}
