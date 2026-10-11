<script setup lang="ts">
import type { ProblemEditingMeta, UserSummaryView } from '@/api/types/problem-editing';
import type { FieldErrors } from '../../ui/admin-errors';
import ProblemBasicsSection from './ProblemBasicsSection.vue';
import ProblemClassSection from './ProblemClassSection.vue';
import ProblemLimitsSection from './ProblemLimitsSection.vue';
import ProblemPeopleSection from './ProblemPeopleSection.vue';
import ProblemStatusSection from './ProblemStatusSection.vue';
import ProblemVisibilitySection from './ProblemVisibilitySection.vue';
import type { ProblemForm } from './problem-form';

const form = defineModel<ProblemForm>({ required: true });
/** `suggester`: who suggested an existing problem (read-only); the create form leaves it out. */
defineProps<{
  meta: ProblemEditingMeta;
  errors: FieldErrors;
  suggester?: UserSummaryView | null;
  isSuggestionPending?: boolean;
}>();
</script>

<template>
  <div class="flex flex-col gap-5">
    <ProblemBasicsSection v-model="form" :errors="errors" />
    <ProblemLimitsSection v-model="form" :meta="meta" :errors="errors" />
    <ProblemClassSection v-model="form" :meta="meta" :errors="errors" />
    <ProblemVisibilitySection v-model="form" :errors="errors" />
    <ProblemPeopleSection
      v-model="form"
      :errors="errors"
      :suggester="suggester ?? null"
      :is-suggestion-pending="isSuggestionPending ?? false"
    />
    <ProblemStatusSection v-model="form" />
  </div>
</template>
