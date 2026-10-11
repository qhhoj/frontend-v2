import { computed, reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useRouter } from 'vue-router';
import { createLanguage, updateLanguage } from '@/api/languages-admin.api';
import type { LanguageAdmin } from '@/api/types/languages-admin';
import { translate } from '@/i18n';
import { isConflict } from '../ui/admin-errors';
import type { FieldErrors } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import { languagesAdminKey } from './languages.queries';
import {
  checkLanguageForm,
  createBodyOf,
  emptyLanguageForm,
  formOf,
  patchOf,
} from './language-form';
import type { LanguageForm } from './language-form';

/** The one write of a form: an update of the stored language, or a create (which leaves the page). */
function useLanguageSave(
  stored: Ref<LanguageAdmin | null>,
  form: LanguageForm,
  onCreated: () => void,
) {
  return useAdminMutation<void, LanguageAdmin>({
    mutate: () =>
      stored.value
        ? updateLanguage(stored.value.id, patchOf(stored.value, form))
        : createLanguage(createBodyOf(form)),
    invalidates: () => [languagesAdminKey],
    successText: (answer) =>
      translate(
        stored.value ? 'admin.languages.form.savedToast' : 'admin.languages.form.createdToast',
        {
          key: answer.key,
        },
      ),
    onDone: (answer) => {
      if (!stored.value) return onCreated();
      stored.value = answer;
      Object.assign(form, formOf(answer));
    },
  });
}

type LanguageSave = ReturnType<typeof useLanguageSave>;

/** A taken key is the only 409 this form can get: say it in the SPA's words, under the key box. */
function serverErrorsOf(save: LanguageSave): FieldErrors {
  if (!isConflict(save.failure.value)) return save.fieldErrors.value;
  return { ...save.fieldErrors.value, key: translate('admin.languages.form.errors.keyTaken') };
}

/** One form for both pages: `initial` is the stored language (edit) or `null` (create). */
export function useLanguageForm(initial: LanguageAdmin | null) {
  const router = useRouter();
  const mode: 'create' | 'edit' = initial ? 'edit' : 'create';
  const stored = ref<LanguageAdmin | null>(initial);
  const form = reactive(initial ? formOf(initial) : emptyLanguageForm());
  const clientErrors = ref<FieldErrors>({});
  const changeCount = computed(() =>
    stored.value ? Object.keys(patchOf(stored.value, form)).length : 0,
  );
  const save = useLanguageSave(stored, form, () => void router.push({ name: 'admin-languages' }));
  const savedAt = ref<Date | null>(null);
  watch(save.isDone, (isDone) => {
    if (isDone) savedAt.value = new Date();
  });
  const errors = computed<FieldErrors>(() => ({ ...serverErrorsOf(save), ...clientErrors.value }));
  watch(form, () => (clientErrors.value = {}), { deep: true });

  /** Puts the form back to the stored language (edit only). */
  function discard() {
    if (stored.value) Object.assign(form, formOf(stored.value));
  }

  async function submit() {
    clientErrors.value = checkLanguageForm(form, mode);
    const isNothingToSend = mode === 'edit' && changeCount.value === 0;
    if (Object.keys(clientErrors.value).length > 0 || isNothingToSend) return;
    await save.run();
  }

  return {
    form,
    mode,
    errors,
    changeCount,
    saved: save.isDone,
    savedAt,
    isPending: save.isPending,
    failure: save.failure,
    submit,
    discard,
  };
}
