<script setup lang="ts">
import { computed } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import {
  fetchContestActions,
  judgeFinal,
  rateContest,
  rescoreContest,
} from '@/api/contest-editing.api';
import type { ContestActions, EditableContest } from '@/api/types/contest-editing';
import { formatNumber } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import { useViewerId } from '@/stores/use-viewer-id';
import { translate } from '@/i18n';
import ContestActionCard from './ContestActionCard.vue';
import ContestCloneCard from './ContestCloneCard.vue';
import ContestDataCard from './ContestDataCard.vue';
import { isBusy, timeLeftText } from './contest-actions';

const props = defineProps<{ contest: EditableContest }>();
const queryClient = useQueryClient();
const viewer = useViewerId();
const locale = useLocaleStore();
const now = useNow();
const actionsKey = () => ['admin', 'contest-actions', props.contest.key, viewer.value] as const;

/** While an action is queued or running the states are polled every 5 s, so the card moves on by itself. */
const { data: actions } = useQuery({
  queryKey: computed(() => actionsKey()),
  queryFn: () => fetchContestActions(props.contest.key),
  refetchInterval: (query) => (Object.values(query.state.data ?? {}).some(isBusy) ? 5000 : false),
});
const stateOf = (name: keyof ContestActions) => actions.value?.[name] ?? 'idle';

/** Starts the action, then re-reads the states: the card shows what the status endpoint now says. */
async function runAction(start: (key: string) => Promise<unknown>) {
  const result = await start(props.contest.key);
  await queryClient.invalidateQueries({ queryKey: actionsKey() });
  return result;
}

const timeLeft = computed(() => timeLeftText(props.contest.endTime, now.value));
const judgeFinalBody = computed(() =>
  timeLeft.value
    ? translate('admin.contests.actions.judgeFinal.confirmBodyEarly', { left: timeLeft.value })
    : translate('admin.contests.actions.judgeFinal.confirmBodyEnded'),
);
const judgeFinalConfirm = computed(() =>
  timeLeft.value
    ? translate('admin.contests.actions.judgeFinal.confirmEarly')
    : translate('admin.contests.actions.judgeFinal.confirmEnded'),
);
const rescoreBody = computed(() =>
  translate('admin.contests.actions.rescore.confirmBody', {
    count: formatNumber(props.contest.userCount, locale.locale),
  }),
);
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="grid gap-5 lg:grid-cols-2">
      <ContestActionCard
        id="rescore"
        :title="$t('admin.contests.actions.rescore.title')"
        :description="$t('admin.contests.actions.rescore.description')"
        :button-label="$t('admin.contests.actions.rescore.button')"
        :confirm-title="$t('admin.contests.actions.rescore.confirmTitle')"
        :confirm-label="$t('admin.contests.actions.rescore.confirm')"
        :state="stateOf('rescore')"
        :run="() => runAction(rescoreContest)"
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
        :confirm-label="judgeFinalConfirm"
        :state="stateOf('judgeFinal')"
        :run="() => runAction(judgeFinal)"
      >
        <template #confirm-body>
          <p class="text-muted">{{ judgeFinalBody }}</p>
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
        :state="stateOf('rate')"
        :run="() => runAction(rateContest)"
      >
        <template #confirm-body>
          <p class="text-muted">{{ $t('admin.contests.actions.rate.confirmBody') }}</p>
        </template>
      </ContestActionCard>
    </div>
    <ContestDataCard :contest-key="contest.key" />
    <ContestCloneCard :contest-key="contest.key" />
  </div>
</template>
