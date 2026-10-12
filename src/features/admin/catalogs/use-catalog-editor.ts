import { computed, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { translate } from '@/i18n';
import { isConflict } from '../ui/admin-errors';
import { countChanges } from '../ui/form/dirty-form';
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
  /** The row's display name in the success toast ("Đã lưu “Đồ thị”"). */
  nameOf: (form: Form) => string;
  onDone: () => void;
}

/** Create-or-edit form of one catalog row: local checks after the first try, the PATCH sends only changed fields, a toast on success. */
export function useCatalogEditor<Row, Form extends object>(
  options: CatalogEditorOptions<Row, Form>,
) {
  const formFor = (row: Row | null) => (row ? options.formOf(row) : options.empty());
  const form = ref(formFor(options.row())) as Ref<Form>;
  const hasTried = ref(false);
  const isCreate = computed(() => options.row() === null);
  /** Fields that differ from the row (or the empty form): the save bar's "2 thay đổi chưa lưu". */
  const dirtyCount = computed(() => countChanges(form.value, formFor(options.row())));
  function discard() {
    form.value = formFor(options.row());
    hasTried.value = false;
  }
  watch(options.row, (row) => {
    form.value = formFor(row);
    hasTried.value = false;
    // Opening another row drops the last save's refusal.
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
    successText: (_result, sent) =>
      translate(isCreate.value ? 'admin.catalogs.created' : 'admin.catalogs.saved', {
        name: options.nameOf(sent).trim(),
      }),
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
  return { form, isCreate, dirtyCount, errors, mutation, isTaken, save, discard };
}
