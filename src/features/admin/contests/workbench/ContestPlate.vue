<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQueryClient } from '@tanstack/vue-query';
import { updateContest } from '@/api/contest-editing.api';
import type { EditableContest } from '@/api/types/contest-editing';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import AppButton from '@/components/ui/AppButton.vue';
import ContestTimeline from '@/components/ui/ContestTimeline.vue';
import Notice from '@/components/ui/Notice.vue';
import Readout from '@/components/ui/Readout.vue';
import ReadoutCell from '@/components/ui/ReadoutCell.vue';
import { timelineTicks } from '@/features/contests/bar/plate-timeline';
import { translate } from '@/i18n';
import { localDayOffset } from '@/lib/contest-time';
import { formatClock, formatDate } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import { usePermissions } from '@/stores/use-permissions';
import { useViewerId } from '@/stores/use-viewer-id';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { needsPermissionText } from '../../ui/permission-text';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { freezeStateOf } from '../contest-admin';
import {
  CONTEST_INDEX_KEY,
  PUBLIC_CONTESTS_KEY,
  editableContestKey,
} from '../contest-editing.queries';
import { canSetVisible } from '../contest-patch';
import { contestStatusOf } from './contest-status';
import type { ContestGap } from './contest-status';

/**
 * The contest workbench's status plate: the one place that says whether students see the contest and what it still
 * lacks. Left: the state in one sentence, the clock's fact and the gaps. Right: "Hiện cho học sinh" or "Ẩn", which
 * change the saved contest at once after a confirm. Below: the contest on its time scale, with the freeze zone.
 * `gaps` is null while the problems' setup is not read yet. While the page has unsaved changes the save bar holds the
 * primary and the plate's button waits.
 */
const props = defineProps<{
  contest: EditableContest;
  gaps: readonly ContestGap[] | null;
  hasUnsaved: boolean;
}>();
const { t } = useI18n();
const { can } = usePermissions();
const locale = useLocaleStore();
const queryClient = useQueryClient();
const viewer = useViewerId();
const now = useNow();
const KEY = 'admin.contests.workbench.plate';

const status = computed(() => contestStatusOf(props.contest));
const isVisible = computed(() => props.contest.settings?.isVisible ?? false);
const canChange = computed(() =>
  canSetVisible(
    {
      isPrivate: props.contest.isPrivate,
      isOrganizationPrivate: props.contest.isOrganizationPrivate,
    },
    can,
  ),
);

const gapText = (gap: ContestGap) =>
  gap.kind === 'problemSetup'
    ? t(`${KEY}.gaps.problemSetup`, { label: gap.label })
    : t(`${KEY}.gaps.${gap.kind === 'participants' ? gap.missing : gap.kind}`);
const gapTexts = computed(() => (props.gaps ?? []).map(gapText));
const clockNote = computed(() => {
  const time = (iso: string) => formatDate(iso, 'datetime', locale.locale);
  if (props.contest.phase === 'upcoming')
    return t(`${KEY}.clock.upcoming`, { time: time(props.contest.startTime) });
  return t(`${KEY}.clock.${props.contest.phase}`, { time: time(props.contest.endTime) });
});
const gapNote = computed(() => {
  if (props.gaps === null) return t(`${KEY}.gaps.loading`);
  return gapTexts.value.length ? gapTexts.value.join(' · ') : t(`${KEY}.gaps.none`);
});

const scale = computed(() => {
  const start = Date.parse(props.contest.startTime);
  const end = Date.parse(props.contest.endTime);
  const isOneDay = localDayOffset(props.contest.startTime, props.contest.endTime) === 0;
  // A one-day contest reads in clocks (the sentence above names the day); a longer one in dates.
  const label = (iso: string) =>
    isOneDay ? formatClock(iso) : formatDate(iso, 'datetime', locale.locale);
  const ends = { start: label(props.contest.startTime), end: label(props.contest.endTime) };
  return { start, end, ticks: timelineTicks(start, end, ends, isOneDay) };
});
const freeze = computed(() => {
  const state = freezeStateOf(props.contest, now.value);
  const at = state.kind === 'scheduled' ? state.at : state.kind === 'frozen' ? state.since : null;
  if (!at) return null;
  return {
    at: at.getTime(),
    text: t(`${KEY}.freeze`, {
      minutes: props.contest.frozenLastMinutes,
      time: formatClock(at.toISOString()),
    }),
  };
});

const isDialogOpen = ref(false);
const mutation = useAdminMutation({
  mutate: (shown: boolean) => updateContest(props.contest.key, { isVisible: shown }),
  invalidates: () => [PUBLIC_CONTESTS_KEY, CONTEST_INDEX_KEY],
  successText: (saved: EditableContest, shown: boolean) =>
    translate(`admin.contests.general.rail.visibility.${shown ? 'shown' : 'hidden'}`, {
      key: saved.key,
    }),
  onSuccess: (saved: EditableContest) => {
    queryClient.setQueryData(editableContestKey(saved.key, viewer.value), saved);
    isDialogOpen.value = false;
  },
});
function openDialog() {
  mutation.reset();
  isDialogOpen.value = true;
}
const blockedReason = computed(() => (props.hasUnsaved ? t(`${KEY}.saveFirst`) : undefined));
const action = computed(() => (isVisible.value ? 'hide' : 'show'));
</script>

<template>
  <Readout :label="$t(`${KEY}.label`)" class="flex flex-col gap-4" data-testid="contest-plate">
    <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <ReadoutCell :label="$t(`${KEY}.state`)" size="word" class="flex-1 basis-80">
        <span data-testid="contest-plate-sentence">{{ $t(`${KEY}.sentence.${status}`) }}</span>
        <template #below>
          <span class="text-small text-muted" data-testid="contest-plate-note"
            >{{ clockNote }} {{ gapNote }}</span
          >
          <span v-if="!canChange" class="text-small text-muted">{{
            needsPermissionText('judge.change_contest_visibility')
          }}</span>
        </template>
      </ReadoutCell>
      <div v-if="canChange" class="flex flex-wrap items-center gap-2">
        <AppButton
          :tone="isVisible ? 'secondary' : 'primary'"
          data-testid="contest-visibility-open"
          :disabled="blockedReason !== undefined"
          :disabled-reason="blockedReason"
          @click="openDialog"
        >
          {{ $t(`${KEY}.${action}.button`) }}
        </AppButton>
      </div>
    </div>
    <div>
      <ContestTimeline
        :start="scale.start"
        :end="scale.end"
        :now="now"
        :freeze-at="freeze?.at ?? null"
        :ticks="scale.ticks"
        :label="$t(`${KEY}.timeline`)"
        :freeze-label="freeze?.text"
      />
      <p v-if="freeze" class="m-0 mt-2 text-small text-muted">{{ freeze.text }}</p>
    </div>
    <ConfirmDialog
      v-model:visible="isDialogOpen"
      :title="$t(`${KEY}.${action}.title`, { key: contest.key })"
      :confirm-label="$t(`${KEY}.${action}.confirm`)"
      :busy="mutation.isPending.value"
      @confirm="mutation.run(!isVisible)"
    >
      <div class="flex flex-col gap-3">
        <p class="m-0">{{ $t(`${KEY}.${action}.body`) }}</p>
        <Notice
          v-if="!isVisible && gapTexts.length"
          tone="warning"
          compact
          role="status"
          :title="$t(`${KEY}.show.warning`)"
          data-testid="contest-visibility-warning"
        >
          <ul class="m-0 list-disc pl-5">
            <li v-for="text in gapTexts" :key="text">{{ text }}</li>
          </ul>
        </Notice>
      </div>
      <template #error>
        <AdminStatus
          v-if="mutation.failure.value"
          kind="refused"
          :text="failureTextOf(mutation.failure.value)"
        />
      </template>
    </ConfirmDialog>
  </Readout>
</template>
