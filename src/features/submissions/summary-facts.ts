/**
 * The fact rows of the submission summary, in display order. `SubmissionSummary.vue` tags each row with its key
 * (`data-fact`) and its spec checks the order; `SubmissionSummarySkeleton.vue` reads the same list.
 */
export const SUMMARY_FACT_KEYS = [
  'problem',
  'user',
  'submitted',
  'language',
  'runtime',
  'judge',
] as const;

/** The row that holds the author's avatar. */
export const AUTHOR_FACT_KEY = 'user';
