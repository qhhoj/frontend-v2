<script setup lang="ts">
import { computed } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import {
  fetchContestActions,
  judgeFinal,
  rateContest,
  rescoreContest,
} from '@/api/contest-editing.api';
import { rebuildReplay } from '@/api/replay.api';
import { CONTEST_ACTION_NAMES } from '@/api/types/contest-editing';
import type { ContestActionName, EditableContest } from '@/api/types/contest-editing';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useViewerId } from '@/stores/use-viewer-id';
import ContestActionCard from './ContestActionCard.vue';
import ContestCloneCard from './ContestCloneCard.vue';
import ContestDataCard from './ContestDataCard.vue';
import { isBoardFrozen, isBusy } from './contest-actions';

const props = defineProps<{ contest: EditableContest }>();
const queryClient = useQueryClient();
const viewer = useViewerId();
const locale = useLocaleStore();
const actionsKey = () => ['admin', 'contest-actions', props.contest.key, viewer.value] as const;

/**
 * The action states from the status endpoint. Until they have answered the buttons are not offered at all: an "idle" guess
 * could queue a second job. While an action is queued or running the states are polled every 5 s.
 */
const {
  data: actions,
  error,
  isPending,
  refetch,
} = useQuery({
  queryKey: computed(() => actionsKey()),
  queryFn: () => fetchContestActions(props.contest.key),
  refetchInterval: (query) => {
    const states = query.state.data;
    return states && CONTEST_ACTION_NAMES.some((name) => isBusy(states[name])) ? 5000 : false;
  },
});
const stateOf = (name: ContestActionName) => actions.value?.[name] ?? 'idle';

/** Starts the action, then re-reads the states: the card shows what the status endpoint now says. */
async function runAction(start: (key: string) => Promise<unknown>) {
  const result = await start(props.contest.key);
  await queryClient.invalidateQueries({ queryKey: actionsKey() });
  return result;
}

/**
 * The server's own refusal rules, which the status endpoint does not report: final judging is for final-submission
 * contests that have ended (`ContestActionsService`), and rating needs an ended contest whose ranking is not frozen.
 */
const hasEnded = computed(() => props.contest.phase === 'ended');
const judgeFinalLock = computed(() =>
  props.contest.formatName === 'final_submission' && hasEnded.value
    ? undefined
    : translate('admin.contests.actions.judgeFinal.unavailable'),
);
const rateLock = computed(() =>
  hasEnded.value && !isBoardFrozen(props.contest)
    ? undefined
    : translate('admin.contests.actions.rate.unavailable'),
);
/** The server refuses a rebuild before the end (409) and has no replay for final-submission contests. */
const replayLock = computed(() =>
  hasEnded.value && props.contest.formatName !== 'final_submission'
    ? undefined
    : translate('admin.replay.rebuild.unavailable'),
);
const rescoreBody = computed(() =>
  translate('admin.contests.actions.rescore.confirmBody', {
    count: formatNumber(props.contest.userCount, locale.locale),
  }),
);
const runRescore = () => runAction(rescoreContest);
const runJudgeFinal = () => runAction(judgeFinal);
const runRate = () => runAction(rateContest);
const runReplayRebuild = () => runAction(rebuildReplay);
</script>

<template>
  <div class="flex flex-col gap-6">
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <div class="grid gap-5 lg:grid-cols-2">
          <SkeletonBlock class="h-48 w-full" />
          <SkeletonBlock class="h-48 w-full" />
          <SkeletonBlock class="h-48 w-full" />
        </div>
      </template>
      <div class="grid gap-5 lg:grid-cols-2">
        <ContestActionCard
          id="rescore"
          :title="$t('admin.contests.actions.rescore.title')"
          :description="$t('admin.contests.actions.rescore.description')"
          :button-label="$t('admin.contests.actions.rescore.button')"
          :confirm-title="$t('admin.contests.actions.rescore.confirmTitle')"
          :confirm-label="$t('admin.contests.actions.rescore.confirm')"
          :state="stateOf('rescore')"
          :run="runRescore"
        >
          <template #confirm-body>
            <p class="text-muted">{{ rescoreBody }}</p>
          </template>
        </ContestActionCard>
        <ContestActionCard
          id="judgeFinal"
          :title="$t('admin.contests.actions.judgeFinal.title')"
          :description="$t('admin.contests.actions.judgeFinal.description')"
          :button-label="$t('admin.contests.actions.judgeFinal.button')"
          :confirm-title="$t('admin.contests.actions.judgeFinal.confirmTitle')"
          :confirm-label="$t('admin.contests.actions.judgeFinal.confirm')"
          :unavailable="judgeFinalLock"
          :state="stateOf('judgeFinal')"
          :run="runJudgeFinal"
        >
          <template #confirm-body>
            <p class="text-muted">{{ $t('admin.contests.actions.judgeFinal.confirmBody') }}</p>
          </template>
        </ContestActionCard>
        <ContestActionCard
          id="rate"
          permission="judge.contest_rating"
          :title="$t('admin.contests.actions.rate.title')"
          :description="$t('admin.contests.actions.rate.description')"
          :button-label="$t('admin.contests.actions.rate.button')"
          :confirm-title="$t('admin.contests.actions.rate.confirmTitle')"
          :confirm-label="$t('admin.contests.actions.rate.confirm')"
          :unavailable="rateLock"
          :state="stateOf('rate')"
          :run="runRate"
        >
          <template #confirm-body>
            <p class="text-muted">{{ $t('admin.contests.actions.rate.confirmBody') }}</p>
          </template>
        </ContestActionCard>
        <ContestActionCard
          id="replay"
          :title="$t('admin.replay.rebuild.title')"
          :description="$t('admin.replay.rebuild.description')"
          :button-label="$t('admin.replay.rebuild.button')"
          :confirm-title="$t('admin.replay.rebuild.confirmTitle')"
          :confirm-label="$t('admin.replay.rebuild.confirm')"
          :unavailable="replayLock"
          :state="stateOf('replay')"
          :run="runReplayRebuild"
        >
          <template #confirm-body>
            <p class="text-muted">{{ $t('admin.replay.rebuild.confirmBody') }}</p>
          </template>
        </ContestActionCard>
      </div>
    </QueryState>
    <ContestDataCard :contest-key="contest.key" :is-ended="hasEnded" />
    <ContestCloneCard :contest-key="contest.key" />
  </div>
</template>
