import type { RatingHistoryEntry } from '@/api/types/users';
import { RATING_TIERS, TIER_LOWER_BOUNDS, tierColor } from './rating-tiers';
import type { TierColor } from './rating-tiers';

export interface ChartBox {
  width: number;
  height: number;
  padding: number;
}
export interface ChartPoint {
  x: number;
  y: number;
  rating: number;
  contestName: string | null;
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

/** y of a rating in the box: a higher rating sits higher, so a smaller y. */
export const ratingY = (rating: number, range: RatingRange, box: ChartBox) =>
  box.height -
  box.padding -
  ((rating - range.low) / (range.high - range.low)) * (box.height - 2 * box.padding);

/** Points for the rated entries, one per contest, spread evenly across the width (one contest sits in the middle). */
export function chartPoints(entries: RatingHistoryEntry[], box: ChartBox): ChartPoint[] {
  const rated = ratedHistory(entries);
  const ratings = rated.map((entry) => entry.rating ?? 0);
  const range = ratingRange(ratings);
  const step = rated.length > 1 ? (box.width - 2 * box.padding) / (rated.length - 1) : 0;
  return rated.map((entry, index) => ({
    x: rated.length > 1 ? box.padding + index * step : box.width / 2,
    y: ratingY(entry.rating ?? 0, range, box),
    rating: entry.rating ?? 0,
    contestName: entry.contestName,
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
