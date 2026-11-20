<script setup lang="ts">
import type { ProblemEditingMeta } from '@/api/types/problem-editing';
import type { FieldErrors } from '../../ui/admin-errors';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import LanguageLimitsTable from './LanguageLimitsTable.vue';
import type { ProblemForm } from './problem-form';

/** The per-language limits. Partial scoring, a field of the same form, is edited in the workbench's judging panel. */
const form = defineModel<ProblemForm>({ required: true });
defineProps<{ meta: ProblemEditingMeta; errors: FieldErrors; sectionId?: string }>();
</script>

<template>
  <AdminFormSection
    :id="sectionId"
    :title="$t('admin.problems.general.limits.languageTitle')"
    :columns="1"
  >
    <LanguageLimitsTable
      v-model="form.languageLimits"
      :languages="meta.languages"
      :errors="errors"
      :default-time-limit="form.timeLimit"
      :default-memory-limit="form.memoryLimit"
    />
  </AdminFormSection>
</template>
