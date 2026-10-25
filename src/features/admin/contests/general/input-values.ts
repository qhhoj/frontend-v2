import { computed } from 'vue';
import type { Ref } from 'vue';
import type { ContestForm } from '../contest-form';

export const textOf = (event: Event): string => (event.target as HTMLInputElement).value;

export type ContestTimeField =
  'startTime' | 'endTime' | 'registrationStart' | 'registrationEnd' | 'lockedAfter';

/** A date field's model: the date fields speak `string | null`, the form keeps '' for an unset time. */
export const timeModel = (form: Ref<ContestForm>, field: ContestTimeField) =>
  computed({
    get: () => form.value[field] || null,
    set: (iso: string | null) => (form.value[field] = iso ?? ''),
  });
