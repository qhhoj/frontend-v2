/** The backend's bounds on a problem's time limit (seconds), memory limit (KiB) and points. */
export const PROBLEM_LIMITS = {
  timeLimit: { min: 0.01, max: 60, highAbove: 5 },
  memoryLimit: { min: 0, max: 1_048_576 },
  points: { min: 800, max: 3500 },
} as const;
