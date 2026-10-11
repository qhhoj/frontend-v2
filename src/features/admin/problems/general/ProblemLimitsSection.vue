<script setup lang="ts">
import type { ProblemEditingMeta } from '@/api/types/problem-editing';
import AdminField from '../../ui/AdminField.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { INPUT } from '../../ui/controls';
import AdminCheckbox from '../../ui/form/AdminCheckbox.vue';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import LanguageLimitsTable from './LanguageLimitsTable.vue';
import type { ProblemForm } from './problem-form';

const form = defineModel<ProblemForm>({ required: true });
defineProps<{ meta: ProblemEditingMeta; errors: FieldErrors; sectionId?: string }>();

const NUMBER_FIELDS = [
  { key: 'timeLimit', step: '0.01' },
  { key: 'memoryLimit', step: '1' },
  { key: 'points', step: '1' },
] as const;
</script>

<template>
  <AdminFormSection
    :id="sectionId"
    :title="$t('admin.problems.general.sections.limits')"
    :description="$t('admin.problems.general.descriptions.limits')"
    :columns="1"
  >
    <div class="grid gap-4 sm:grid-cols-3">
      <AdminField
        v-for="field in NUMBER_FIELDS"
        :key="field.key"
        v-slot="{ id, describedBy, invalid }"
        :input-id="`problem-${field.key}`"
        :label="$t(`admin.problems.general.limits.${field.key}`)"
        :hint="$t(`admin.problems.general.limits.${field.key}Hint`)"
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
    <AdminCheckbox
      v-model="form.partial"
      input-id="problem-partial"
      :label="$t('admin.problems.general.limits.partial')"
      :description="$t('admin.problems.general.limits.partialHint')"
    />
    <LanguageLimitsTable
      v-model="form.languageLimits"
      :languages="meta.languages"
      :errors="errors"
      :default-time-limit="form.timeLimit"
      :default-memory-limit="form.memoryLimit"
    />
  </AdminFormSection>
</template>
