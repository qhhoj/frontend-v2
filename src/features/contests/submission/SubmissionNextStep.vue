<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next';
import type { ContestProblem } from '@/api/types/contests';
import AppButton from '@/components/ui/AppButton.vue';

/** Under the result in the viewer's running contest: the next problem one click away. */
defineProps<{ next: ContestProblem }>();
</script>

<template>
  <AppButton
    size="sm"
    data-testid="submission-next"
    :to="{ name: 'problem', params: { code: next.code } }"
    class="max-w-full self-start"
  >
    <span class="truncate">{{
      $t('submission.contest.next', { label: next.label, name: next.name })
    }}</span>
    <ChevronRight aria-hidden="true" />
  </AppButton>
</template>
