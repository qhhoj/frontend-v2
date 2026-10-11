<script setup lang="ts">
import type { ProblemEditingMeta, UserSummaryView } from '@/api/types/problem-editing';
import type { FieldErrors } from '../../ui/admin-errors';
import type { EditorView } from '../../ui/form/editor-view';
import ProblemBasicForm from './ProblemBasicForm.vue';
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
/**
 * The general form as its Basic or Advanced `view`. `suggester`: who suggested an existing problem (read-only);
 * `privateCode`, `canPublishToMembers`: see `ProblemPublishField`.
 */
defineProps<{
  view: EditorView;
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
  <ProblemBasicForm
    v-if="view === 'basic'"
    v-model="form"
    :errors="errors"
    :private-code="privateCode"
    :can-publish-to-members="canPublishToMembers"
  />
  <template v-else>
    <ProblemBasicsSection
      v-model="form"
      :errors="errors"
      :section-id="PROBLEM_SECTION_IDS.basics"
    />
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
      :has-change-message="hasChangeMessage"
      :section-id="PROBLEM_SECTION_IDS.status"
    />
  </template>
</template>
