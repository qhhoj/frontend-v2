<script setup lang="ts">
import AdminField from '../../ui/AdminField.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { INPUT } from '../../ui/controls';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import type { ProblemForm } from './problem-form';
import ProblemPublishField from './ProblemPublishField.vue';

/** The Basic view ("Cơ bản") of the general form: code, name, the three limits, and "Công khai". */
const form = defineModel<ProblemForm>({ required: true });
defineProps<{ errors: FieldErrors; privateCode?: string; canPublishToMembers?: boolean }>();
const KEY = 'admin.problems.general';
const TEXT_FIELDS = [
  { key: 'code', mono: true },
  { key: 'name', mono: false },
] as const;
const NUMBER_FIELDS = [
  { key: 'timeLimit', step: '0.01' },
  { key: 'memoryLimit', step: '1' },
  { key: 'points', step: '1' },
] as const;
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
        :label="$t(`${KEY}.limits.${field.key}`)"
        :hint="$t(`${KEY}.limits.${field.key}Hint`)"
        :error="errors[field.key]"
        required
      >
        <input
          :id="id"
          v-model.number="form[field.key]"
          type="number"
          inputmode="decimal"
          :step="field.step"
          :class="[INPUT, 'font-mono tabular-nums']"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
        />
      </AdminField>
    </div>
  </AdminFormSection>
  <AdminFormSection
    :title="$t(`${KEY}.basic.sections.publish`)"
    :description="$t(`${KEY}.basic.leads.publish`)"
    :columns="1"
  >
    <ProblemPublishField
      v-model="form"
      :private-code="privateCode"
      :can-publish-to-members="canPublishToMembers"
    />
  </AdminFormSection>
</template>
