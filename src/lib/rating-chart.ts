import type { RatingHistoryEntry } from '@/api/types/users';
import { RATING_TIERS, TIER_LOWER_BOUNDS, tierColor } from './rating-tiers';
import type { TierColor } from './rating-tiers';

/** The drawing area: the plot is the rectangle left of `width - right`, between `top` and `height - bottom`; the margins hold the axis labels. */
export interface ChartBox {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}
export interface ChartPoint {
  x: number;
  y: number;
  rating: number;
  /** Rating change against the contest before; null for the first rated contest. */
  delta: number | null;
  contestName: string | null;
  endTime: string;
  rank: number | null;
}
export interface RatingRange {
  low: number;
  high: number;
}
export interface TierBand {
  color: TierColor;
  low: number;
  high: number;
}
const STEP = 100;

/** Entries with a rating (hidden or frozen boards have none), oldest first. */
export const ratedHistory = (entries: RatingHistoryEntry[]) =>
  entries
    .filter((entry) => entry.rating !== null)
    .sort((left, right) => Date.parse(left.endTime) - Date.parse(right.endTime));

/** At least 100 of room above and below, rounded out to hundreds. */
export const ratingRange = (ratings: number[]): RatingRange => ({
  low: Math.floor((Math.min(...ratings) - STEP) / STEP) * STEP,
  high: Math.ceil((Math.max(...ratings) + STEP) / STEP) * STEP,
});

export const ratingTicks = ({ low, high }: RatingRange) =>
  Array.from({ length: (high - low) / STEP + 1 }, (_tick, index) => low + index * STEP);

const LABEL_STEPS = [100, 200, 500, 1000, 2000];
/** Rating labels and grid lines: multiples of the smallest step that keeps them `minGap` units apart, so 2 200 rating points do not stack into one smear. */
export function ratingLabelTicks({ low, high }: RatingRange, plotHeight: number, minGap = 18) {
  const step =
    LABEL_STEPS.find((candidate) => ((high - low) / candidate) * minGap <= plotHeight) ??
    LABEL_STEPS.at(-1)!;
  const first = Math.ceil(low / step) * step;
  return Array.from(
    { length: Math.floor((high - first) / step) + 1 },
    (_tick, index) => first + index * step,
  );
}

/** Indices of the contests that get an x label: the last one and every `ceil(minGap / spacing)`-th before it, so neighbouring labels stay `minGap` apart and the current contest is always named. */
export function labelledIndices(count: number, spacing: number, minGap: number): number[] {
  const every = spacing > 0 ? Math.max(1, Math.ceil(minGap / spacing)) : 1;
  const indices: number[] = [];
  for (let index = count - 1; index >= 0; index -= every) indices.unshift(index);
  return indices;
}

/** `text` cut with an ellipsis so that it fits `maxWidth` at `charWidth` per character. */
export function truncateLabel(text: string, maxWidth: number, charWidth = 6.4) {
  const fit = Math.max(1, Math.floor(maxWidth / charWidth));
  return text.length <= fit ? text : `${text.slice(0, Math.max(1, fit - 1)).trimEnd()}…`;
}

/** y of a rating in the box: a higher rating sits higher, so a smaller y. */
export const ratingY = (rating: number, range: RatingRange, box: ChartBox) =>
  box.height -
  box.bottom -
  ((rating - range.low) / (range.high - range.low)) * (box.height - box.top - box.bottom);

const POINT_INSET = 14;
const MAX_POINT_SPACING = 150;

/** Distance between neighbouring contests: even across the plot, at most `MAX_POINT_SPACING` so a few contests huddle in the middle instead of spreading thin. */
export const pointSpacing = (count: number, box: ChartBox) =>
  count < 2
    ? 0
    : Math.min(
        MAX_POINT_SPACING,
        (box.width - box.left - box.right - 2 * POINT_INSET) / (count - 1),
      );

/** Points for the rated entries, one per contest, evenly spaced and centred in the plot (one contest sits in the middle). */
export function chartPoints(entries: RatingHistoryEntry[], box: ChartBox): ChartPoint[] {
  const rated = ratedHistory(entries);
  const range = ratingRange(rated.map((entry) => entry.rating ?? 0));
  const step = pointSpacing(rated.length, box);
  const first = box.left + (box.width - box.left - box.right - step * (rated.length - 1)) / 2;
  return rated.map((entry, index) => ({
    x: first + index * step,
    y: ratingY(entry.rating ?? 0, range, box),
    rating: entry.rating ?? 0,
    delta: index === 0 ? null : (entry.rating ?? 0) - (rated[index - 1]!.rating ?? 0),
    contestName: entry.contestName,
    endTime: entry.endTime,
    rank: entry.rank,
  }));
}

/** One band per tier inside the range, coloured like the tier's usernames; tiers outside the range draw nothing. */
export function tierBands(range: RatingRange): TierBand[] {
  const edges = [-Infinity, ...TIER_LOWER_BOUNDS, Infinity];
  return RATING_TIERS.map((tier, index) => ({
    color: tierColor(tier),
    low: Math.max(edges[index]!, range.low),
    high: Math.min(edges[index + 1]!, range.high),
  })).filter((band) => band.low < band.high);
}

/** The vertical extent of a tier band in the box, for its background rectangle. */
export const bandGeometry = (band: TierBand, range: RatingRange, box: ChartBox) => {
  const top = ratingY(band.high, range, box);
  return { y: top, height: ratingY(band.low, range, box) - top };
};

/** Tier bands tall enough (in px) to hold their name at the right edge. */
export const labelledBands = <Band extends { height: number }>(bands: Band[], minHeight = 14) =>
  bands.filter((band) => band.height >= minHeight);

/** Where a tooltip of `size` goes: right of the point, flipped left when it would pass the plot's right edge, and kept inside the box vertically. */
export function tooltipPosition(
  point: { x: number; y: number },
  size: { width: number; height: number },
  box: ChartBox,
  gap = 12,
) {
  const fitsRight = point.x + gap + size.width <= box.width - box.right;
  const left = fitsRight ? point.x + gap : Math.max(2, point.x - gap - size.width);
  const top = Math.min(
    Math.max(point.y - size.height / 2, 2),
    box.height - box.bottom - size.height,
  );
  return { x: left, y: top };
}
