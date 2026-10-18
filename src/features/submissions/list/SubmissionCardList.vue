<script setup lang="ts">
import type { SubmissionListItem } from '@/api/types/submissions';
import UserLink from '@/components/UserLink.vue';
import { translate } from '@/i18n';
import { formatAgoCompact, formatCaseMemory, formatCaseTime, formatDateTime } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { VERDICT_TONE_CLASSES, submissionVerdictOf } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import SubmissionPickBox from '../SubmissionPickBox.vue';
import SubmissionProblemName from '../SubmissionProblemName.vue';
import SubmissionSourceLink from '../SubmissionSourceLink.vue';
import { useRowOpen } from '../row-open';
import type { ColumnKey } from '../submission-table-cells';
import { NO_VALUE, isFinished } from '../submission-row';
import ScoreRing from './ScoreRing.vue';
import TestStrip from './TestStrip.vue';

/**
 * From md, the list's roomy rows as cards: score ring; problem, then submitter and age, then the per-test strip; verdict and
 * time, memory and language in a fixed-width right column, so every card's strip has the same width. Below md (P-08) a
 * ledger of 56 px rows in one card: ring, problem over "user · language · run time · age", and the verdict code. `columns`
 * hides what the table would hide. A row without `testSummary` (hidden from this viewer, or an older backend) has no strip.
 */
const props = defineProps<{
  submissions: SubmissionListItem[];
  columns: readonly ColumnKey[];
  highlightIds: ReadonlySet<string>;
  problemLabels: Record<string, string>;
  pickedIds?: readonly string[];
}>();
const emit = defineEmits<{ togglePick: [id: string] }>();
const locale = useLocaleStore();
const { openRow, openRowInTab } = useRowOpen();
const RELATIVE_REFRESH_MS = 15_000;
const now = useNow(RELATIVE_REFRESH_MS);
const isShown = (key: ColumnKey) => props.columns.includes(key);
const pickOrder = (id: string) => (props.pickedIds?.indexOf(id) ?? -1) + 1;
const summaryOf = (row: SubmissionListItem) => row.testSummary ?? null;
const hasCost = (row: SubmissionListItem) =>
  isShown('cost') && isFinished(row) && row.time !== null && row.memory !== null;
const rowLabel = (row: SubmissionListItem) =>
  translate('submissions.rowLabel', {
    id: row.id,
    user: row.user?.username ?? NO_VALUE,
    problem: row.problem?.name ?? NO_VALUE,
    verdict: translate(submissionVerdictOf(row).labelKey),
  });
/** The phone's second line after the submitter: language, then the run time once judged. */
const phoneMeta = (row: SubmissionListItem) => [
  ...(isShown('language') && row.language ? [row.language.name] : []),
  ...(hasCost(row) ? [formatCaseTime(row.time!)] : []),
];
/** On md+ each chip fills a fixed slot with right-aligned tabular figures, so time, memory and language line up across cards. */
const PILL =
  'rounded-pill px-2.5 py-0.5 font-mono text-xs font-semibold whitespace-nowrap tabular-nums md:text-right';
</script>

<template>
  <ul
    data-testid="submission-card-list"
    class="m-0 flex list-none flex-col gap-2.5 p-0 max-md:gap-0 max-md:overflow-hidden max-md:rounded-row max-md:border max-md:border-line"
    :aria-label="$t('submissions.listName')"
  >
    <li
      v-for="row in submissions"
      :key="row.id"
      :data-id="row.id"
      class="@container grid min-h-14 cursor-pointer items-center gap-x-3 gap-y-2 bg-surface-solid px-3 py-2 hover:bg-surface-hover max-md:border-t max-md:border-line max-md:first:border-t-0 md:gap-x-4 md:rounded-row md:border md:border-line md:px-5 md:py-3.5"
      :class="[
        pickedIds
          ? 'grid-cols-[auto_auto_minmax(0,1fr)_auto] md:grid-cols-[auto_auto_minmax(0,1fr)_15rem_auto]'
          : 'grid-cols-[auto_minmax(0,1fr)_auto] md:grid-cols-[auto_minmax(0,1fr)_15rem_auto]',
        { 'row-added': highlightIds.has(row.id) },
      ]"
      @click="openRow($event, row.id)"
      @auxclick="openRowInTab($event, row.id)"
    >
      <SubmissionPickBox
        v-if="pickedIds"
        :id="row.id"
        :order="pickOrder(row.id)"
        :picked-count="pickedIds.length"
        @toggle="emit('togglePick', $event)"
      />
      <ScoreRing :row="row" />
      <div class="min-w-0">
        <SubmissionProblemName
          v-if="isShown('problem')"
          class="text-sm md:text-base"
          :problem="row.problem"
          :label="row.problem ? problemLabels[row.problem.code] : undefined"
          show-code
        />
        <div
          class="mt-0.5 min-w-0 text-meta text-muted max-md:truncate md:mt-1 md:flex md:flex-wrap md:items-center md:gap-x-2 md:gap-y-1 md:text-sm"
        >
          <UserLink
            v-if="isShown('user') && row.user"
            :username="row.user.username"
            :rating="row.user.rating"
          />
          <template v-for="(part, index) in phoneMeta(row)" :key="part">
            <span
              v-if="index > 0 || (isShown('user') && row.user)"
              aria-hidden="true"
              class="mx-1 md:hidden"
              >·</span
            >
            <span class="font-mono whitespace-nowrap md:hidden">{{ part }}</span>
          </template>
          <span
            v-if="isShown('when') && (isShown('user') || phoneMeta(row).length)"
            aria-hidden="true"
            class="mx-1 md:mx-0"
            :class="{ 'md:hidden': !isShown('user') }"
            >·</span
          >
          <time
            v-if="isShown('when')"
            class="whitespace-nowrap"
            :datetime="row.date"
            :title="formatDateTime(row.date, locale.locale)"
            >{{ formatAgoCompact(row.date, now, locale.locale) }}</time
          >
        </div>
        <TestStrip
          v-if="summaryOf(row)"
          class="max-md:hidden"
          :summary="summaryOf(row)!"
          :is-grading="!isFinished(row)"
        />
      </div>
      <div class="flex items-center justify-end md:grid md:grid-cols-1 md:gap-1.5">
        <RouterLink
          :to="{ name: 'submission', params: { id: row.id } }"
          :aria-label="rowLabel(row)"
          class="relative inline-flex min-h-8 items-center rounded-pill px-2.5 pointer-coarse:after:absolute pointer-coarse:after:-inset-y-1.5 pointer-coarse:after:inset-x-0 font-mono text-xs font-bold whitespace-nowrap hover:brightness-95 md:justify-center md:px-3"
          :class="VERDICT_TONE_CLASSES[submissionVerdictOf(row).tone]"
          >{{ submissionVerdictOf(row).code
          }}<span class="max-md:hidden">
            · {{ $t(submissionVerdictOf(row).labelKey) }}</span
          ></RouterLink
        >
        <div
          class="flex flex-wrap gap-1.5 max-md:hidden md:grid md:grid-cols-[3.75rem_4.75rem_minmax(0,1fr)]"
        >
          <template v-if="hasCost(row)">
            <span :class="[PILL, 'bg-limit-time-bg text-limit-time']">{{
              formatCaseTime(row.time!)
            }}</span>
            <span :class="[PILL, 'bg-limit-memory-bg text-limit-memory']">{{
              formatCaseMemory(row.memory!)
            }}</span>
          </template>
          <span
            v-if="isShown('language') && row.language"
            :title="row.language.name"
            :class="[PILL, 'truncate bg-surface-strong text-muted md:col-start-3']"
            >{{ row.language.name }}</span
          >
        </div>
      </div>
      <SubmissionSourceLink :id="row.id" class="max-md:hidden" />
    </li>
  </ul>
</template>
