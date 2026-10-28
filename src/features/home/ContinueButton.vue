<script setup lang="ts">
import { computed } from 'vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { continueProblem } from './continue-target';
import { useRecentSubmissionsQuery } from './home.queries';

/** The personal card's primary action: back to the last problem that is not solved, or to the problem list. */
const props = defineProps<{ username: string }>();
const { data: submissions, isPending } = useRecentSubmissionsQuery(() => props.username);
const problem = computed(() => continueProblem(submissions.value ?? []));
</script>

<template>
  <!-- The skeleton has the button's height, so the fallback or the problem name does not move the card. -->
  <SkeletonBlock v-if="isPending" pill class="h-(--qh-control) w-56 max-w-full" />
  <AppButton
    v-else-if="problem"
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
