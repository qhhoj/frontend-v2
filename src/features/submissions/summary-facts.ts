/**
 * The fact rows of the submission's aside card, in display order. `SubmissionFacts.vue` tags each row with its key
 * (`data-fact`); `SubmissionFactsSkeleton.vue` reads the same list.
 */
export const SUMMARY_FACT_KEYS = ['problem', 'user', 'submitted', 'language', 'judge'] as const;

/** The row that holds the author's avatar. */
export const AUTHOR_FACT_KEY = 'user';
