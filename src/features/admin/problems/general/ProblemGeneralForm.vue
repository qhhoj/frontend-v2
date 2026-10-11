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
import { PROBLEM_SECTION_IDS } from './problem-sections';

const form = defineModel<ProblemForm>({ required: true });
/** The revision comment; bound only by the edit form. */
const changeMessage = defineModel<string>('changeMessage');
/** `suggester`: who suggested an existing problem (read-only); `privateCode`: see `ProblemStatusSection`. The create form leaves both out. */
defineProps<{
  meta: ProblemEditingMeta;
  errors: FieldErrors;
  suggester?: UserSummaryView | null;
  isSuggestionPending?: boolean;
  privateCode?: string;
  hasChangeMessage?: boolean;
  canPublishToMembers?: boolean;
}>();
</script>

<template>
  <ProblemBasicsSection v-model="form" :errors="errors" :section-id="PROBLEM_SECTION_IDS.basics" />
  <ProblemLimitsSection
    v-model="form"
    :meta="meta"
    :errors="errors"
    :section-id="PROBLEM_SECTION_IDS.limits"
  />
  <ProblemClassSection
    v-model="form"
    :meta="meta"
    :errors="errors"
    :section-id="PROBLEM_SECTION_IDS.classes"
  />
  <ProblemVisibilitySection
    v-model="form"
    :errors="errors"
    :section-id="PROBLEM_SECTION_IDS.visibility"
  />
  <ProblemPeopleSection
    v-model="form"
    :errors="errors"
    :suggester="suggester ?? null"
    :is-suggestion-pending="isSuggestionPending ?? false"
    :section-id="PROBLEM_SECTION_IDS.people"
  />
  <ProblemStatusSection
    v-model="form"
    v-model:change-message="changeMessage"
    :private-code="privateCode"
    :has-change-message="hasChangeMessage"
    :section-id="PROBLEM_SECTION_IDS.status"
    :can-publish-to-members="canPublishToMembers"
  />
</template>
