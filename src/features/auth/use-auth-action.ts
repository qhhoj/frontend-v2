import { computed, nextTick, ref } from 'vue';
import type { Ref } from 'vue';
import { authErrorText, fieldErrorTexts, hiddenIssueTexts } from './auth-errors';

/**
 * What every auth form does around its request: a pending flag, the failure as text, per-field messages for the
 * inputs, and focus on the first invalid input. `visibleFields` are the field names the form renders; an issue for
 * any other name has no input to sit under, so the summary line explains it (or says "invalid data").
 */
export function useAuthAction(
  formElement: Ref<HTMLElement | null> = ref(null),
  visibleFields: readonly string[] = [],
) {
  const pending = ref(false);
  const error = ref<unknown>(null);
  const dismissed = ref<string[]>([]);
  const allFieldErrors = computed(() => fieldErrorTexts(error.value));
  const fieldErrors = computed(() =>
    Object.fromEntries(
      Object.entries(allFieldErrors.value).filter(([name]) => !dismissed.value.includes(name)),
    ),
  );
  /** The line above the button: everything except failures that every input already explains. */
  const summary = computed(() => {
    if (!error.value) return null;
    const hidden = hiddenIssueTexts(error.value, visibleFields);
    if (hidden.length) return hidden.join(' ');
    const names = Object.keys(allFieldErrors.value);
    const allShown = names.length > 0 && names.every((name) => visibleFields.includes(name));
    return allShown ? null : authErrorText(error.value);
  });

  /** The viewer is fixing this field: its old server message is stale. */
  const dismiss = (name: string) => {
    if (!dismissed.value.includes(name)) dismissed.value.push(name);
  };
  const focusFirstInvalid = () =>
    formElement.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  /** Forget the failure and the dismissed fields: a reopened dialog starts clean. */
  const reset = () => {
    error.value = null;
    dismissed.value = [];
  };

  /** Runs one attempt; true when it succeeded. A second call while one is pending does nothing. */
  async function run(action: () => Promise<unknown>): Promise<boolean> {
    if (pending.value) return false;
    pending.value = true;
    error.value = null;
    dismissed.value = [];
    try {
      await action();
      return true;
    } catch (caught) {
      error.value = caught;
      await nextTick();
      focusFirstInvalid();
      return false;
    } finally {
      pending.value = false;
    }
  }

  return { pending, error, fieldErrors, summary, run, dismiss, reset, focusFirstInvalid };
}
