<script setup lang="ts">
import { ChevronDown, ChevronUp } from 'lucide-vue-next';
import type { VoteResponse, VoteScore } from '@/api/types/votes';
import { useVote } from '@/features/vote/use-vote';

/** Up/down arrows and the score between; `canVote` false (anonymous, own text) keeps them visible but inert. */
const props = withDefaults(
  defineProps<{
    score: number;
    viewerVote: VoteScore;
    canVote: boolean;
    send: (score: VoteScore) => Promise<VoteResponse>;
    orientation?: 'column' | 'row';
  }>(),
  { orientation: 'column' },
);
const emit = defineEmits<{ voted: [] }>();
const vote = useVote(
  () => ({ score: props.score, viewerVote: props.viewerVote }),
  (score) => props.send(score),
);
const press = async (pressed: 1 | -1) => {
  if (!props.canVote || vote.isPending.value) return;
  if (await vote.cast(pressed)) emit('voted');
};
const ARROW =
  'inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-hover aria-disabled:cursor-not-allowed aria-disabled:hover:bg-transparent aria-pressed:bg-accent-soft aria-pressed:text-accent-soft-text';
</script>

<template>
  <div class="flex flex-col items-center gap-1">
    <div
      class="flex items-center gap-0.5"
      :class="orientation === 'column' ? 'flex-col' : 'flex-row'"
    >
      <button
        type="button"
        :aria-label="$t('vote.up')"
        :aria-pressed="vote.viewerVote.value === 1"
        :aria-disabled="canVote ? undefined : 'true'"
        :class="ARROW"
        @click="press(1)"
      >
        <ChevronUp aria-hidden="true" class="size-5" />
      </button>
      <span
        data-testid="vote-score"
        class="min-w-8 text-center font-mono font-semibold tabular-nums"
      >
        {{ vote.score.value }}
      </span>
      <button
        type="button"
        :aria-label="$t('vote.down')"
        :aria-pressed="vote.viewerVote.value === -1"
        :aria-disabled="canVote ? undefined : 'true'"
        :class="ARROW"
        @click="press(-1)"
      >
        <ChevronDown aria-hidden="true" class="size-5" />
      </button>
    </div>
    <p v-if="vote.errorKey.value" role="alert" class="max-w-40 text-center text-xs text-negative">
      {{ $t(vote.errorKey.value) }}
    </p>
  </div>
</template>
