<script setup lang="ts">
import type { ProblemEditingMeta } from '@/api/types/problem-editing';
import type { FieldErrors } from '../../ui/admin-errors';
import AdminCheckbox from '../../ui/form/AdminCheckbox.vue';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import LanguageLimitsTable from './LanguageLimitsTable.vue';
import type { ProblemForm } from './problem-form';

const form = defineModel<ProblemForm>({ required: true });
defineProps<{ meta: ProblemEditingMeta; errors: FieldErrors; sectionId?: string }>();
</script>

<template>
  <AdminFormSection
    :id="sectionId"
    :title="$t('admin.problems.general.sections.limits')"
    :description="$t('admin.problems.general.descriptions.limits')"
    :columns="1"
  >
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
