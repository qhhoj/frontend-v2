<script setup lang="ts">
import { computed } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import { continueProblem } from './continue-target';
import { useRecentSubmissionsQuery } from './home.queries';

/** The personal card's primary action: back to the last problem that is not solved, or to the problem list. */
const props = defineProps<{ username: string }>();
const { data: submissions } = useRecentSubmissionsQuery(() => props.username);
const problem = computed(() => continueProblem(submissions.value ?? []));
</script>

<template>
  <AppButton
    v-if="problem"
    tone="primary"
    :to="{ name: 'problem', params: { code: problem.code } }"
    class="max-w-full self-start"
    data-testid="continue-problem"
    ><span class="truncate">{{ $t('home.continue', { problem: problem.name }) }}</span></AppButton
  >
  <AppButton v-else tone="primary" :to="{ name: 'problems' }" class="self-start">{{
    $t('home.anon.problems')
  }}</AppButton>
</template>
