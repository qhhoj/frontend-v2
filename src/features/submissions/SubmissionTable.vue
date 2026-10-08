<script setup lang="ts">
import { computed } from 'vue';
import type { SubmissionListItem } from '@/api/types/submissions';
import { FINISHED_STATUSES } from '@/api/types/submissions';
import GlassCard from '@/components/GlassCard.vue';
import UserName from '@/components/UserName.vue';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import VerdictBadge from '@/components/VerdictBadge.vue';
import {
  formatCaseMemory,
  formatCaseTime,
  formatDateTime,
  formatNumber,
  formatRelative,
} from '@/lib/format';
import { translate } from '@/i18n';
import { ringFraction } from '@/lib/grading';
import { useNow } from '@/lib/use-now';
import { VERDICT_TONE_CLASSES, verdictOf } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import {
  BODY_CELL_CLASSES,
  FULL_TABLE_MIN_WIDTH_CLASS,
  HEADER_CELL_CLASSES,
} from './submission-table-cells';
import type { ColumnKey } from './submission-table-cells';

/** Keep `SubmissionTableSkeleton.vue` in step: same card, header cells and row classes. */
const props = withDefaults(
  defineProps<{
    submissions: SubmissionListItem[];
    showProblem?: boolean;
    /** Columns to show, in table order; omitted shows all of them. */
    columnKeys?: readonly ColumnKey[];
    /** Rows that just arrived: they fade in from the accent colour. */
    highlightIds?: ReadonlySet<string>;
    /** Problem code to the contest letter, shown before the name (contest lists only). */
    problemLabels?: Record<string, string>;
  }>(),
  {
    showProblem: true,
    highlightIds: () => new Set<string>(),
    problemLabels: () => ({}),
    columnKeys: undefined,
  },
);
const locale = useLocaleStore();
/** "2 minutes ago" does not need a tick every second. */
const RELATIVE_REFRESH_MS = 15_000;
const now = useNow(RELATIVE_REFRESH_MS);
const NO_VALUE = '—';
const PERCENT = 100;
const POINT_FRACTION_DIGITS = 2;

const COLUMNS = [
  { key: 'verdict', isNumber: false },
  { key: 'problem', isNumber: false },
  { key: 'user', isNumber: false },
  { key: 'score', isNumber: true },
  { key: 'time', isNumber: true },
  { key: 'memory', isNumber: true },
  { key: 'language', isNumber: false },
  { key: 'when', isNumber: false },
] as const;
const columns = computed(() =>
  COLUMNS.filter(
    (column) =>
      (props.showProblem || column.key !== 'problem') &&
      (!props.columnKeys || props.columnKeys.includes(column.key)),
  ),
);
const isShown = (key: ColumnKey) => columns.value.some((column) => column.key === key);

const rowLabel = (row: SubmissionListItem) =>
  translate('submissions.rowLabel', {
    id: row.id,
    user: row.user?.username ?? NO_VALUE,
    problem: row.problem?.name ?? NO_VALUE,
    verdict: translate(verdictOf(row).labelKey),
  });
const isFinished = (row: SubmissionListItem) => FINISHED_STATUSES.includes(row.status);
/** Points based: the list rows carry no test count. */
const gradingPercent = (row: SubmissionListItem) =>
  row.status === 'G' && row.caseTotal > 0 ? ` ${Math.round(ringFraction(row) * PERCENT)}%` : '';
/** Only a finished row has numbers worth showing. */
const finishedValue = (
  row: SubmissionListItem,
  format: (value: number) => string,
  value: number | null,
) => (isFinished(row) && value !== null ? format(value) : NO_VALUE);
const formatScore = (value: number) =>
  formatNumber(value, locale.locale, POINT_FRACTION_DIGITS, false);
</script>

<template>
  <GlassCard as="div" data-testid="submission-table-card" class="overflow-hidden">
    <div
      tabindex="0"
      role="region"
      :aria-label="$t('submissions.scrollRegion')"
      class="overflow-x-auto focus-visible:-outline-offset-2"
    >
      <table
        class="w-full border-collapse text-[15px]"
        :class="columnKeys ? '' : FULL_TABLE_MIN_WIDTH_CLASS"
      >
        <caption class="sr-only">
          {{
            $t('submissions.listName')
          }}
        </caption>
        <thead>
          <tr class="text-left text-[13px] text-muted">
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :class="[HEADER_CELL_CLASSES, { 'text-right': column.isNumber }]"
            >
              {{ $t(`submissions.columns.${column.key}`) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in submissions"
            :key="row.id"
            :data-id="row.id"
            class="border-t border-line"
            :class="{ 'row-added': highlightIds.has(row.id) }"
          >
            <td :class="BODY_CELL_CLASSES">
              <RouterLink
                :to="{ name: 'submission', params: { id: row.id } }"
                :aria-label="rowLabel(row)"
                class="flex min-h-7 items-center text-content hover:underline"
              >
                <VerdictBadge v-if="isFinished(row)" :verdict="verdictOf(row)" size="sm" />
                <span
                  v-else
                  class="inline-flex h-7 items-center rounded-full px-2 text-xs font-bold"
                  :class="VERDICT_TONE_CLASSES.pending"
                  >{{ $t(verdictOf(row).labelKey) }}{{ gradingPercent(row) }}</span
                >
              </RouterLink>
            </td>
            <td v-if="isShown('problem')" :class="BODY_CELL_CLASSES">
              <template v-if="row.problem">
                <span
                  v-if="problemLabels[row.problem.code]"
                  class="mr-1.5 font-display font-bold"
                  >{{ problemLabels[row.problem.code] }}</span
                >
                <RouterLink
                  :to="{ name: 'problem', params: { code: row.problem.code } }"
                  class="font-semibold text-content hover:underline"
                  >{{ row.problem.name }}</RouterLink
                >
                <div class="font-mono text-xs text-muted">{{ row.problem.code }}</div>
              </template>
              <template v-else>{{ NO_VALUE }}</template>
            </td>
            <td v-if="isShown('user')" :class="BODY_CELL_CLASSES">
              <span v-if="row.user" class="flex items-center gap-2">
                <UserAvatar :username="row.user.username" :size="24" />
                <UserName :username="row.user.username" />
              </span>
              <template v-else>{{ NO_VALUE }}</template>
            </td>
            <td
              v-if="isShown('score')"
              :class="[BODY_CELL_CLASSES, 'text-right font-mono tabular-nums']"
            >
              {{ finishedValue(row, formatScore, row.points) }}
            </td>
            <td
              v-if="isShown('time')"
              :class="[BODY_CELL_CLASSES, 'text-right font-mono tabular-nums']"
            >
              {{ finishedValue(row, formatCaseTime, row.time) }}
            </td>
            <td
              v-if="isShown('memory')"
              :class="[BODY_CELL_CLASSES, 'text-right font-mono tabular-nums']"
            >
              {{ finishedValue(row, formatCaseMemory, row.memory) }}
            </td>
            <td v-if="isShown('language')" :class="[BODY_CELL_CLASSES, 'text-muted']">
              {{ row.language?.name ?? NO_VALUE }}
            </td>
            <td v-if="isShown('when')" :class="[BODY_CELL_CLASSES, 'whitespace-nowrap text-muted']">
              <time :datetime="row.date" :title="formatDateTime(row.date, locale.locale)">{{
                formatRelative(row.date, now, locale.locale)
              }}</time>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </GlassCard>
</template>
