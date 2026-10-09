<script setup lang="ts">
import type { ProblemEditingMeta } from '@/api/types/problem-editing';
import type { FieldErrors } from '../../ui/admin-errors';
import ProblemBasicsSection from './ProblemBasicsSection.vue';
import ProblemClassSection from './ProblemClassSection.vue';
import ProblemLimitsSection from './ProblemLimitsSection.vue';
import ProblemVisibilitySection from './ProblemVisibilitySection.vue';
import type { ProblemForm } from './problem-form';

const form = defineModel<ProblemForm>({ required: true });
defineProps<{ meta: ProblemEditingMeta; errors: FieldErrors }>();
</script>

<template>
  <div class="flex flex-col gap-5">
    <ProblemBasicsSection v-model="form" :errors="errors" />
    <ProblemLimitsSection v-model="form" :meta="meta" :errors="errors" />
    <ProblemClassSection v-model="form" :meta="meta" :errors="errors" />
    <ProblemVisibilitySection v-model="form" :errors="errors" />
    <!-- Task 6 inserts ProblemPeopleSection and ProblemStatusSection after the visibility section. -->
  </div>
</template>
