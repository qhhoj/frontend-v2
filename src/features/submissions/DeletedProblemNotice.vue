<script setup lang="ts">
import GlassCard from '@/components/GlassCard.vue';
import InlineBit from '@/components/InlineBit.vue';
import { DELETED_PROBLEM_BIT } from './deleted-problem';

/** Stands where the cases table would be: the problem and its test data are gone, the submission stays. */
defineProps<{ name: string }>();
</script>

<template>
  <GlassCard
    as="section"
    data-testid="deleted-problem-notice"
    aria-labelledby="deleted-problem-title"
    class="flex items-start gap-4 rounded-panel p-6 sm:p-8"
  >
    <InlineBit :kind="DELETED_PROBLEM_BIT" />
    <div class="flex flex-col gap-1">
      <h2 id="deleted-problem-title" class="font-display text-base font-bold">
        {{ $t('deletedProblem.noticeTitle') }}
      </h2>
      <p class="text-muted">{{ $t('deletedProblem.noticeBody', { name }) }}</p>
    </div>
  </GlassCard>
</template>
