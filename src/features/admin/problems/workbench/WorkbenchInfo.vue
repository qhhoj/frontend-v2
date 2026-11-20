<script setup lang="ts">
import type { EditableProblem, ProblemEditingMeta } from '@/api/types/problem-editing';
import Card from '@/components/ui/Card.vue';
import Disclosure from '@/components/ui/Disclosure.vue';
import ProblemBasicForm from '../general/ProblemBasicForm.vue';
import ProblemBasicsSection from '../general/ProblemBasicsSection.vue';
import ProblemClassSection from '../general/ProblemClassSection.vue';
import ProblemLimitsSection from '../general/ProblemLimitsSection.vue';
import ProblemPeopleSection from '../general/ProblemPeopleSection.vue';
import ProblemStatusSection from '../general/ProblemStatusSection.vue';
import ProblemVisibilitySection from '../general/ProblemVisibilitySection.vue';
import type { Workbench } from './use-workbench';

/**
 * Section 1: the fields every problem needs (code, name, limits, points, group, types, languages), then one fold for what
 * a teacher rarely changes (source and date, per-language limits, licence, what contestants may see, people and
 * organizations, status and the revision comment). An error in the fold opens it.
 */
const props = defineProps<{
  problem: EditableProblem;
  meta: ProblemEditingMeta;
  info: Workbench['info'];
}>();
const { form, errors, changeMessage } = props.info;
const isMoreOpen = defineModel<boolean>('moreOpen', { default: false });
</script>

<template>
  <Card padding="none" as="div">
    <ProblemBasicForm v-model="form" :errors="errors" />
    <ProblemClassSection v-model="form" :meta="meta" :errors="errors" />
  </Card>
  <Disclosure v-model:open="isMoreOpen" :label="$t('admin.problems.workbench.info.more')">
    <Card padding="none" as="div">
      <ProblemBasicsSection v-model="form" :errors="errors" />
      <ProblemLimitsSection v-model="form" :meta="meta" :errors="errors" />
      <ProblemClassSection v-model="form" :meta="meta" :errors="errors" part="license" />
      <ProblemVisibilitySection v-model="form" :errors="errors" />
      <ProblemPeopleSection
        v-model="form"
        :errors="errors"
        :suggester="problem.editor?.suggester ?? null"
        :is-suggestion-pending="!problem.isPublic"
      />
      <ProblemStatusSection
        v-model="form"
        v-model:change-message="changeMessage"
        has-change-message
      />
    </Card>
  </Disclosure>
</template>
