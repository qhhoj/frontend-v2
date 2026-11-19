<script setup lang="ts">
import { computed } from 'vue';
import QueryState from '@/components/QueryState.vue';
import Modal from '@/components/ui/Modal.vue';
import UserLink from '@/components/UserLink.vue';
import { useCommentVotesQuery } from './comments.queries';

/** Moderators (`judge.change_comment`): who voted on a comment, up-votes first. A voter whose account is gone shows as such. */
const props = defineProps<{ commentId: string }>();
const visible = defineModel<boolean>('visible', { required: true });
const { data, isPending, error, refetch } = useCommentVotesQuery(
  () => props.commentId,
  () => visible.value,
);
const votes = computed(() =>
  [...(data.value ?? [])].sort((left, right) => right.score - left.score),
);
const ups = computed(() => votes.value.filter((vote) => vote.score > 0).length);
</script>

<template>
  <Modal v-model:visible="visible" size="sm">
    <template #header>
      <div class="flex flex-wrap items-baseline gap-2">
        <h2 class="font-display text-subtitle leading-7 font-semibold">
          {{ $t('comments.votes.title') }}
        </h2>
        <span v-if="votes.length" class="text-sm text-muted">
          · {{ $t('comments.votes.count', { up: ups, down: votes.length - ups }) }}
        </span>
      </div>
    </template>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <p class="text-sm text-muted">{{ $t('comments.votes.loading') }}</p>
      </template>
      <p v-if="!votes.length" class="text-sm text-muted">{{ $t('comments.votes.none') }}</p>
      <ul v-else class="flex flex-col divide-y divide-line">
        <li
          v-for="(vote, index) in votes"
          :key="vote.voter?.id ?? `gone-${index}`"
          class="flex min-h-11 items-center justify-between gap-3"
        >
          <UserLink
            v-if="vote.voter"
            :username="vote.voter.username"
            :rating="vote.voter.rating"
            size="xs"
          />
          <span v-else class="text-muted">{{ $t('comments.votes.gone') }}</span>
          <span
            class="font-mono font-semibold tabular-nums"
            :class="vote.score > 0 ? 'text-cue-full' : 'text-cue-zero'"
          >
            {{ vote.score > 0 ? '+1' : '−1' }}
          </span>
        </li>
      </ul>
    </QueryState>
  </Modal>
</template>
