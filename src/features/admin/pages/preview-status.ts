export type PreviewStatus = 'saved' | 'updating' | 'paused' | 'done';

/** Order matters: the saved page wins; a keystroke after the wait is a new request ("updating") even if the last one was refused. */
export function previewStatusOf(input: {
  isUntouched: boolean;
  isUpdating: boolean;
  isRateLimited: boolean;
}): PreviewStatus {
  if (input.isUntouched) return 'saved';
  if (input.isUpdating) return 'updating';
  return input.isRateLimited ? 'paused' : 'done';
}
