<script setup lang="ts">
import { computed } from 'vue';
import type { SubmissionListItem } from '@/api/types/submissions';
import { FINISHED_STATUSES } from '@/api/types/submissions';
import GlassCard from '@/components/GlassCard.vue';
import UserName from '@/components/UserName.vue';
import VerdictBadge from '@/components/VerdictBadge.vue';
import {
  formatCaseMemory,
  formatCaseTime,
  formatDateTime,
  formatNumber,
  formatRelative,
} from '@/lib/format';
import { ringFraction } from '@/lib/grading';
import { useNow } from '@/lib/use-now';
import { VERDICT_TONE_CLASSES, verdictOf } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';

/** Keep `SubmissionTableSkeleton.vue` in step: same card, header cells and row classes. */
const props = withDefaults(
  defineProps<{
    submissions: SubmissionListItem[];
    showProblem?: boolean;
    /** Rows that just arrived: they fade in from the accent colour. */
    highlightIds?: ReadonlySet<string>;
  }>(),
  { showProblem: true, highlightIds: () => new Set<string>() },
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
  COLUMNS.filter((column) => props.showProblem || column.key !== 'problem'),
);

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
      <table class="w-full min-w-[900px] border-collapse text-[15px]">
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
              class="px-3 py-3.5 font-medium first:pl-6 last:pr-6"
              :class="{ 'text-right': column.isNumber }"
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
            <td class="px-3 py-[11px] first:pl-6">
              <RouterLink
                :to="{ name: 'submission', params: { id: row.id } }"
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
            <td v-if="showProblem" class="px-3 py-[11px]">
              <template v-if="row.problem">
                <RouterLink
                  :to="{ name: 'problem', params: { code: row.problem.code } }"
                  class="font-semibold text-content hover:underline"
                  >{{ row.problem.name }}</RouterLink
                >
                <div class="font-mono text-xs text-muted">{{ row.problem.code }}</div>
              </template>
              <template v-else>{{ NO_VALUE }}</template>
            </td>
            <td class="px-3 py-[11px]">
              <UserName v-if="row.user" :username="row.user.username" />
              <template v-else>{{ NO_VALUE }}</template>
            </td>
            <td class="px-3 py-[11px] text-right font-mono tabular-nums">
              {{ finishedValue(row, formatScore, row.points) }}
            </td>
            <td class="px-3 py-[11px] text-right font-mono tabular-nums">
              {{ finishedValue(row, formatCaseTime, row.time) }}
            </td>
            <td class="px-3 py-[11px] text-right font-mono tabular-nums">
              {{ finishedValue(row, formatCaseMemory, row.memory) }}
            </td>
            <td class="px-3 py-[11px] text-muted">{{ row.language?.name ?? NO_VALUE }}</td>
            <td class="px-3 py-[11px] whitespace-nowrap text-muted last:pr-6">
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
