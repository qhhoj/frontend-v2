<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { SubmissionResult } from '@/api/types/submissions';
import type { PpEntry, PpSubmission } from '@/api/types/users';
import LanguageLabel from '@/components/language/LanguageLabel.vue';
import DataTable from '@/components/ui/DataTable.vue';
import type { DataTableColumn } from '@/components/ui/DataTableColumns';
import StatePanel from '@/components/StatePanel.vue';
import VerdictLabel from '@/components/VerdictLabel.vue';
import { translate } from '@/i18n';
import { usePpQuery } from '@/features/users/users.queries';
import { formatFixed, formatNumber, scoreCut } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { pageFromQuery } from '@/lib/paging';
import { VERDICT_TONES, submissionVerdictOf } from '@/lib/verdicts';
import type { Verdict } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';

/** The PP table, one page of `/users/:username/pp-breakdown`; below 640 px each row is a card with every figure. */
const PP_PAGE_SIZE = 10;
const COLUMNS = computed<DataTableColumn[]>(() => [
  { key: 'rank', label: translate('profileTabs.columns.rank'), align: 'end' },
  { key: 'problem', label: translate('profileTabs.columns.problem'), priority: 'primary' },
  { key: 'weight', label: translate('profileTabs.columns.weight'), align: 'end' },
  { key: 'points', label: translate('profileTabs.columns.points'), align: 'end' },
  {
    key: 'scaled',
    label: translate('profileTabs.columns.scaled'),
    align: 'end',
    priority: 'badge',
  },
  { key: 'submission', label: translate('profileTabs.columns.submission'), stacked: true },
]);
const route = useRoute();
const locale = useLocaleStore();
const username = computed(() => String(route.params.username));
const page = computed(() => pageFromQuery(route.query.page));
const { data, error, isPending, refetch } = usePpQuery(username, page);
const entries = computed(() => data.value?.items ?? []);
const ranks = computed(() => ({
  first: entries.value[0]?.rank ?? 0,
  last: entries.value.at(-1)?.rank ?? 0,
}));

/** Weights and counted PP always show one decimal (`100,0`); points show at most one. */
const POINT_DIGITS = 1;
/** A row's points; short of full (its cases fell short) they are cut, never rounded up to the problem's points. */
const pointsShown = ({ points, submission }: PpEntry) =>
  submission.casePoints < submission.caseTotal ? scoreCut(points, POINT_DIGITS) : points;
const isResult = (value: string | null): value is SubmissionResult =>
  value !== null && Object.hasOwn(VERDICT_TONES, value);
/** The verdict of the submission a PP row counts (a judged row without a known result reads as done); an AC short of its case total reads PC. */
const verdictFor = (submission: PpSubmission): Verdict =>
  submissionVerdictOf({
    status: 'D',
    result: isResult(submission.result) ? submission.result : null,
    points: null,
    problem: null,
    casePoints: submission.casePoints,
    caseTotal: submission.caseTotal,
  });
</script>

<template>
  <StatePanel
    v-if="error && !isPending"
    kind="error"
    :title="$t('profileTabs.ppErrorTitle')"
    :body="$t('profileTabs.ppErrorBody')"
  >
    <AppButton @click="refetch()">{{ $t('common.retry') }}</AppButton>
  </StatePanel>
  <div v-else class="flex flex-col gap-4">
    <DataTable
      :columns="COLUMNS"
      :rows="entries"
      :row-key="(entry) => String(entry.rank)"
      :row-to="(entry) => ({ name: 'problem', params: { code: entry.problem.code } })"
      :label="$t('profile.tabs.pp')"
      :loading="isPending"
      :skeleton-rows="PP_PAGE_SIZE"
      :empty-text="$t('profileTabs.noPp')"
      :pager="data ? { meta: data.meta, label: $t('profileTabs.ppPager') } : undefined"
    >
      <template #cell-rank="{ row }">{{ row.rank }}</template>
      <template #cell-problem="{ row }">
        <span class="block font-semibold">{{ row.problem.name }}</span>
        <span class="block font-mono text-caption leading-4 text-muted">{{
          row.problem.code
        }}</span>
      </template>
      <template #cell-weight="{ row }">{{ formatFixed(row.weight, locale.locale, 1) }}%</template>
      <template #cell-points="{ row }">
        {{ formatNumber(pointsShown(row), locale.locale, POINT_DIGITS) }}
      </template>
      <template #cell-scaled="{ row }">
        <span class="font-semibold">{{ formatFixed(row.scaledPoints, locale.locale, 1) }}</span>
      </template>
      <template #cell-submission="{ row }">
        <RouterLink
          :to="{ name: 'submission', params: { id: row.submission.id } }"
          class="flex flex-col items-start gap-0.5 hover:underline"
        >
          <span class="flex items-center gap-2">
            <VerdictLabel :verdict="verdictFor(row.submission)" short />
            <span class="font-mono text-meta tabular-nums">
              {{ row.submission.casePoints }}/{{ row.submission.caseTotal }}
            </span>
          </span>
          <span class="flex items-center gap-1 text-caption leading-4 whitespace-nowrap text-muted">
            <LanguageLabel
              :language="{ key: row.submission.languageKey, name: row.submission.language }"
            />
            ·
            {{ formatDate(row.submission.date, 'date', locale.locale) }}
          </span>
        </RouterLink>
      </template>
    </DataTable>
    <p v-if="entries.length" class="text-center text-sm text-muted">
      {{ $t('profileTabs.ppFooter', { first: ranks.first, last: ranks.last }) }}
    </p>
  </div>
</template>
