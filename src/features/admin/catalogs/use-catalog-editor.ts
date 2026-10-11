import { computed, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { translate } from '@/i18n';
import { isConflict } from '../ui/admin-errors';
import type { FieldErrors } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import type { AdminQueryKey } from '../ui/use-admin-mutation';
import { changedFields, trimmedForm } from './catalog-forms';

interface CatalogEditorOptions<Row, Form extends object> {
  /** The row being edited; null creates a new one. */
  row: () => Row | null;
  empty: () => Form;
  formOf: (row: Row) => Form;
  check: (form: Form) => FieldErrors;
  create: (form: Form) => Promise<unknown>;
  update: (row: Row, patch: Partial<Form>) => Promise<unknown>;
  invalidates: AdminQueryKey[];
  /** The unique field a 409 `conflict` names (`name` or `key`). */
  uniqueField: keyof Form & string;
  onDone: () => void;
}

/** Create-or-edit form of one catalog row: local checks after the first try, the PATCH sends only changed fields. */
export function useCatalogEditor<Row, Form extends object>(
  options: CatalogEditorOptions<Row, Form>,
) {
  const formFor = (row: Row | null) => (row ? options.formOf(row) : options.empty());
  const form = ref(formFor(options.row())) as Ref<Form>;
  const hasTried = ref(false);
  const isCreate = computed(() => options.row() === null);
  watch(options.row, (row) => {
    form.value = formFor(row);
    hasTried.value = false;
    // Opening another row drops the last save's status; leaving edit mode after a save keeps its "saved".
    if (row) mutation.reset();
  });

  const mutation = useAdminMutation({
    mutate: (sent: Form) => {
      const row = options.row();
      return row
        ? options.update(row, changedFields(options.formOf(row), sent))
        : options.create(trimmedForm(sent));
    },
    invalidates: () => options.invalidates,
    onDone: () => {
      form.value = options.empty();
      hasTried.value = false;
      options.onDone();
    },
  });
  const isTaken = computed(() => isConflict(mutation.failure.value));
  const errors = computed<FieldErrors>(() => ({
    ...(hasTried.value ? options.check(form.value) : {}),
    ...mutation.fieldErrors.value,
    ...(isTaken.value ? { [options.uniqueField]: translate('admin.catalogs.errors.taken') } : {}),
  }));

  async function save() {
    hasTried.value = true;
    if (Object.keys(options.check(form.value)).length) return;
    await mutation.run({ ...form.value });
  }
  return { form, isCreate, errors, mutation, isTaken, save };
}
