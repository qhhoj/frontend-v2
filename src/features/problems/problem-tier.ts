/** Difficulty tier of a problem by its points: 1 easiest. Drawn as a colour square beside the number, never as colour alone. */
export type ProblemTier = 1 | 2 | 3 | 4;

const TIER_FLOORS = [
  { floor: 2500, tier: 4 },
  { floor: 1600, tier: 3 },
  { floor: 1000, tier: 2 },
] as const;

export const tierOf = (points: number): ProblemTier =>
  TIER_FLOORS.find((entry) => points >= entry.floor)?.tier ?? 1;
