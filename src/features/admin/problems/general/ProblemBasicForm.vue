<script setup lang="ts">
import { computed } from 'vue';
import { KIB_PER_MIB } from '@/lib/measure';
import AdminField from '../../ui/AdminField.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { INPUT } from '../../ui/controls';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import type { ProblemForm } from './problem-form';

/**
 * The first fields of the workbench's info section: code, name, time limit, memory limit and points. The memory limit is kept
 * in KiB (the API's unit) and typed in MB; a value the user does not touch is never rewritten.
 */
const form = defineModel<ProblemForm>({ required: true });
defineProps<{ errors: FieldErrors }>();
const KEY = 'admin.problems.general';
const TEXT_FIELDS = [
  { key: 'code', mono: true },
  { key: 'name', mono: false },
] as const;
const NUMBER_FIELDS = [
  { key: 'timeLimit', step: '0.01', label: `${KEY}.limits.timeLimit` },
  { key: 'memoryLimit', step: '1', label: 'admin.problems.workbench.info.memory' },
  { key: 'points', step: '1', label: `${KEY}.limits.points` },
] as const;
type NumberField = (typeof NUMBER_FIELDS)[number]['key'];
/** An emptied box holds '' (as `v-model.number` leaves it), so the field's own check reports it. */
type Typed = number | '';
const memoryMb = computed<Typed>({
  get: () =>
    typeof form.value.memoryLimit === 'number' ? form.value.memoryLimit / KIB_PER_MIB : '',
  set: (megabytes) =>
    (form.value.memoryLimit = (
      megabytes === '' ? megabytes : Math.round(megabytes * KIB_PER_MIB)
    ) as number),
});
const valueOf = (key: NumberField): Typed =>
  key === 'memoryLimit' ? memoryMb.value : form.value[key];
function setValue(key: NumberField, event: Event) {
  const { value, valueAsNumber } = event.target as HTMLInputElement;
  const typed: Typed = value === '' || Number.isNaN(valueAsNumber) ? '' : valueAsNumber;
  if (key === 'memoryLimit') memoryMb.value = typed;
  else form.value[key] = typed as number;
}
</script>

<template>
  <AdminFormSection
    :title="$t(`${KEY}.basic.sections.info`)"
    :description="$t(`${KEY}.basic.leads.info`)"
  >
    <AdminField
      v-for="field in TEXT_FIELDS"
      :key="field.key"
      v-slot="{ id, describedBy, invalid }"
      :input-id="`problem-${field.key}`"
      :label="$t(`${KEY}.basics.${field.key}`)"
      :hint="$t(`${KEY}.basics.${field.key}Hint`)"
      :error="errors[field.key]"
      required
    >
      <input
        :id="id"
        v-model="form[field.key]"
        :class="[INPUT, field.mono && 'font-mono']"
        autocomplete="off"
        :spellcheck="field.mono ? 'false' : undefined"
        :aria-describedby="describedBy"
        :aria-invalid="invalid === 'true'"
      />
    </AdminField>
    <div class="grid gap-4 sm:grid-cols-3 lg:col-span-2">
      <AdminField
        v-for="field in NUMBER_FIELDS"
        :key="field.key"
        v-slot="{ id, describedBy, invalid }"
        :input-id="`problem-${field.key}`"
        :label="$t(field.label)"
        :hint="$t(`${field.label}Hint`)"
        :error="errors[field.key]"
        required
      >
        <input
          :id="id"
          :value="valueOf(field.key)"
          type="number"
          inputmode="decimal"
          :step="field.step"
          :class="[INPUT, 'font-mono tabular-nums']"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
          @input="setValue(field.key, $event)"
        />
      </AdminField>
    </div>
  </AdminFormSection>
</template>
