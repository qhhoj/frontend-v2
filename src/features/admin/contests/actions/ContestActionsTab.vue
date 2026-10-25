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
import { contestActionsKey } from '../contest-ops.queries';
import ContestActionCard from './ContestActionCard.vue';
import ContestCloneCard from './ContestCloneCard.vue';
import ContestDataCard from './ContestDataCard.vue';
import ContestDeleteCard from './ContestDeleteCard.vue';
import ContestFreezeLockCard from './ContestFreezeLockCard.vue';
import ContestProblemOpsCard from './ContestProblemOpsCard.vue';
import ContestPublishCard from './ContestPublishCard.vue';
import { isBoardFrozen, isBusy } from './contest-actions';

const props = defineProps<{ contest: EditableContest }>();
/** One block per action card, about as tall as the loaded card so the cards below do not move. */
const SKELETON_HEIGHTS = [
  'h-[178px]',
  'h-[194px] lg:h-[178px]',
  'h-[154px] lg:h-[178px]',
  'h-[198px] lg:h-[178px]',
];
/** A group heading: the cards are the sections' content, so the heading stays small. */
const GROUP = 'm-0 text-xs font-semibold tracking-wide text-muted uppercase';
const queryClient = useQueryClient();
const viewer = useViewerId();
const locale = useLocaleStore();
const actionsKey = () => contestActionsKey(props.contest.key, viewer.value);

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
 * contests that have started (`ContestEditingService.judgeFinal`), and rating needs an ended contest whose ranking is not frozen.
 */
const hasEnded = computed(() => props.contest.phase === 'ended');
/** Final judging may run once a final-submission contest has started; before the end it is early, and the dialog says so. */
const judgeFinalLock = computed(() =>
  props.contest.formatName === 'final_submission' && props.contest.phase !== 'upcoming'
    ? undefined
    : translate('admin.contests.actions.judgeFinal.unavailable'),
);
const isJudgingEarly = computed(() => props.contest.phase === 'running');
/** Two separate causes, each named: not ended yet, or ended with the ranking still frozen. */
const rateLock = computed(() => {
  if (!hasEnded.value) return translate('admin.contestOps.rate.notEnded');
  return isBoardFrozen(props.contest) ? translate('admin.contestOps.rate.frozen') : undefined;
});
/** How many pending final submissions are left, for a final-submission contest. */
const judgeFinalDescription = computed(() => {
  const base = translate('admin.contests.actions.judgeFinal.description');
  if (props.contest.formatName !== 'final_submission' || !actions.value) return base;
  const pending = translate('admin.contestOps.judgeFinal.pending', {
    count: formatNumber(actions.value.pendingCount, locale.locale),
  });
  return `${base} ${pending}`;
});
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
  <div class="flex flex-col gap-8">
    <section class="flex flex-col gap-3" aria-labelledby="contest-actions-jobs">
      <h2 id="contest-actions-jobs" :class="GROUP">
        {{ $t('admin.contests.actions.groups.jobs') }}
      </h2>
      <QueryState :loading="isPending" :error="error" @retry="refetch()">
        <template #skeleton>
          <div class="grid gap-4 lg:grid-cols-2">
            <SkeletonBlock
              v-for="height in SKELETON_HEIGHTS"
              :key="height"
              :class="height"
              class="w-full"
            />
          </div>
        </template>
        <div class="grid gap-4 lg:grid-cols-2">
          <ContestActionCard
            id="rescore"
            :title="$t('admin.contests.actions.rescore.title')"
            :description="$t('admin.contests.actions.rescore.description')"
            :button-label="$t('common.rescore')"
            :confirm-title="$t('admin.contests.actions.rescore.confirmTitle')"
            :confirm-label="$t('common.rescore')"
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
            :description="judgeFinalDescription"
            :button-label="$t('admin.contests.actions.judgeFinal.button')"
            :confirm-title="$t('admin.contests.actions.judgeFinal.confirmTitle')"
            :confirm-label="$t('admin.contests.actions.judgeFinal.confirm')"
            :unavailable="judgeFinalLock"
            :state="stateOf('judgeFinal')"
            :run="runJudgeFinal"
          >
            <template #confirm-body>
              <p class="text-muted">{{ $t('admin.contests.actions.judgeFinal.confirmBody') }}</p>
              <p v-if="isJudgingEarly" class="font-semibold text-negative">
                {{ $t('admin.contests.actions.judgeFinal.earlyWarning') }}
              </p>
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
    </section>
    <section
      id="contest-actions-problem"
      class="flex scroll-mt-20 flex-col gap-3"
      aria-labelledby="contest-actions-problem-title"
    >
      <h2 id="contest-actions-problem-title" :class="GROUP">
        {{ $t('admin.contests.actions.groups.problem') }}
      </h2>
      <ContestProblemOpsCard :contest="contest" />
    </section>
    <section class="flex flex-col gap-3" aria-labelledby="contest-actions-board">
      <h2 id="contest-actions-board" :class="GROUP">
        {{ $t('admin.contests.actions.groups.board') }}
      </h2>
      <div class="grid items-start gap-4 xl:grid-cols-2">
        <ContestFreezeLockCard :contest="contest" />
        <ContestPublishCard :contest="contest" :actions="actions" />
      </div>
    </section>
    <section class="flex flex-col gap-3" aria-labelledby="contest-actions-copy">
      <h2 id="contest-actions-copy" :class="GROUP">
        {{ $t('admin.contests.actions.groups.copy') }}
      </h2>
      <div class="grid items-start gap-4 xl:grid-cols-2">
        <ContestDataCard :contest-key="contest.key" :is-ended="hasEnded" />
        <ContestCloneCard :contest="contest" />
      </div>
    </section>
    <section class="flex flex-col gap-3" aria-labelledby="contest-actions-danger">
      <h2 id="contest-actions-danger" :class="GROUP">
        {{ $t('admin.contests.actions.groups.danger') }}
      </h2>
      <ContestDeleteCard :contest="contest" />
    </section>
  </div>
</template>
