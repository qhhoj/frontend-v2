import { onScopeDispose, watch, watchEffect } from 'vue';
import type { Ref } from 'vue';
import { submissionsOnScreen, trackSubmission } from './tracked-submissions';

/**
 * The problem page's part of the verdict toast: each submission sent from its form is handed to the shell, which follows it to
 * the final verdict even after the viewer leaves, and the page says while it shows the result so no toast repeats it.
 * `isResultVisible` is true while the result strip is on screen (open pane, or the phone sheet's bar).
 */
export function useVerdictToastTracking(input: {
  submissionId: Ref<string | null>;
  wasSolvedBefore: () => boolean;
  isResultVisible: () => boolean;
}) {
  watch(input.submissionId, (id) => {
    if (id) trackSubmission({ id, wasSolvedBefore: input.wasSolvedBefore() });
  });
  let shown: string | null = null;
  const stopShowing = () => {
    if (shown !== null) submissionsOnScreen.delete(shown);
    shown = null;
  };
  watchEffect(() => {
    stopShowing();
    const id = input.submissionId.value;
    if (id && input.isResultVisible()) {
      submissionsOnScreen.add(id);
      shown = id;
    }
  });
  onScopeDispose(stopShowing);
}
