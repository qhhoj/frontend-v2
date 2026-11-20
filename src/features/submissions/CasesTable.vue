<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { ChevronRight } from 'lucide-vue-next';
import { useRoute } from 'vue-router';
import type { SubmissionBatch, SubmissionCase } from '@/api/types/submissions';
import AppButton from '@/components/ui/AppButton.vue';
import FoldPanel from '@/components/ui/FoldPanel.vue';
import VerdictChip from '@/components/ui/VerdictChip.vue';
import { TABLE_HEAD_CELL } from '@/components/ui/table-classes';
import { translate } from '@/i18n';
import CaseDetails from './CaseDetails.vue';
import { caseDetails, type CaseDetail } from './case-details';
import { NO_VALUE, formatCaseMemory, formatCaseTime } from '@/lib/format';
import { PARTIAL_CODE, caseVerdictOf, type Verdict } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import { formatCasePoints, isFullCase } from './test-overview';

/**
 * The tests of a submission ("Từng test"): the tests that lost points one per row, the full ones folded into one line
 * until "Hiện tất cả", then the `footer` slot (the subtasks and the total, `TestOverview.vue`). When every test is
 * correct there is nothing to list: the section is that one line with "Hiện tất cả" beside it, without the table's
 * header and without the footer (the plate already says the score). A test's feedback and
 * output stay closed until its row is opened. Keep `CasesTableSkeleton.vue` in step: same card, header cells and row classes. Below `sm` the same rows lay out as cards
 * (test, verdict and points, then time and memory), so each test keeps one `#case-<n>` anchor. Cells pad 24 px on the left, the same edge as the card title.
 */
const props = defineProps<{
  cases: SubmissionCase[] | null;
  batches: SubmissionBatch[] | null;
  /** The row is being graded live: results arrive by themselves (the plate's squares show the tests still waiting). */
  running: boolean;
}>();

const locale = useLocaleStore();
const COLUMN_KEYS = ['test', 'result', 'time', 'memory', 'points'] as const;

interface GradedRow {
  key: string;
  label: string;
  verdict: Verdict;
  time: string;
  memory: string;
  points: string;
  details: CaseDetail[];
  /** Full points: the row the ledger leaves out until "Hiện tất cả". */
  isFull: boolean;
}

const caseRow = (testCase: SubmissionCase): GradedRow => ({
  key: `case-${testCase.position}`,
  label: String(testCase.position),
  verdict: caseVerdictOf(testCase),
  time: formatCaseTime(testCase.time),
  memory: formatCaseMemory(testCase.memory),
  points: formatCasePoints(testCase.points, testCase.total, locale.locale),
  details: caseDetails(testCase),
  isFull: isFullCase(testCase),
});
const batchRow = (batch: SubmissionBatch): GradedRow => ({
  key: `batch-${batch.batch}`,
  label: translate('submission.cases.batch', { number: batch.batch }),
  verdict: caseVerdictOf(batch),
  time: NO_VALUE,
  memory: NO_VALUE,
  points: formatCasePoints(batch.points, batch.total, locale.locale),
  details: [],
  isFull: batch.points >= batch.total,
});

/** Every row starts closed so the result reads at a glance; a row with judge text opens on a click, or all at once. */
const opened = ref(new Set<string>());
const isOpen = (key: string) => opened.value.has(key);
const toggle = (key: string) => {
  if (!opened.value.delete(key)) opened.value.add(key);
};
/** The ledger lists the tests that lost points; "Hiện tất cả" adds the full ones. A link to one test (`#case-<n>`) shows all. */
const isShowingAll = ref(false);
const route = useRoute();
/**
 * A link to one test (`#case-<n>`, from the plate's test squares or a shared URL) shows every row, opens that test and
 * brings it into view: its row may not be drawn before (a full test is folded), so the browser alone finds no target.
 */
watch(
  () => route.hash,
  async (hash) => {
    if (!hash.startsWith('#case-')) return;
    opened.value.add(hash.slice(1));
    isShowingAll.value = true;
    await nextTick();
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'center' });
  },
  { immediate: true },
);

const allRows = computed(() =>
  props.cases ? props.cases.map(caseRow) : (props.batches ?? []).map(batchRow),
);
const fullCount = computed(() => allRows.value.filter((row) => row.isFull).length);
const gradedRows = computed(() =>
  isShowingAll.value ? allRows.value : allRows.value.filter((row) => !row.isFull),
);
const expandable = computed(() => gradedRows.value.filter((row) => row.details.length > 0));
const allOpen = computed(
  () => expandable.value.length > 0 && expandable.value.every((row) => isOpen(row.key)),
);
const toggleAll = () => {
  opened.value = allOpen.value ? new Set() : new Set(expandable.value.map((row) => row.key));
};
/** The phone card grid of a row and where each cell sits in it; from `sm` up they are plain table cells. */
const ROW_CARD =
  'max-sm:grid max-sm:grid-cols-[auto_minmax(0,1fr)_auto] max-sm:items-center max-sm:gap-x-2.5 max-sm:gap-y-0.5 max-sm:py-2.5';
const CELL = 'h-(--qh-row) px-3 max-sm:h-auto max-sm:p-0';
const NUMBER_CELL = `${CELL} text-right font-mono tabular-nums`;
const CELL_PLACES = {
  test: 'max-sm:col-start-1 max-sm:row-start-1',
  result: 'max-sm:col-start-2 max-sm:row-start-1',
  time: 'max-sm:col-start-2 max-sm:row-start-2 max-sm:text-left max-sm:text-caption max-sm:text-muted',
  memory: 'max-sm:col-start-3 max-sm:row-start-2 max-sm:text-caption max-sm:text-muted',
  points: 'max-sm:col-start-3 max-sm:row-start-1',
} as const;
const pointsClass = (verdict: Verdict) =>
  verdict.code === PARTIAL_CODE ? 'font-bold text-verdict-partial' : '';
const hasRows = computed(() => allRows.value.length > 0);
const isHidden = computed(() => props.cases === null && props.batches === null);
/** The full tests are folded into one line while only the tests that lost points are listed. */
const isFolded = computed(() => !isShowingAll.value && fullCount.value > 0);
/** Every test is correct and the judging is over: one line stands for the table until "Hiện tất cả". */
const isAllFull = computed(
  () => !props.running && hasRows.value && fullCount.value === allRows.value.length,
);
const isOneLine = computed(() => isAllFull.value && !isShowingAll.value);
const foldedText = computed(() =>
  isAllFull.value
    ? translate('submission.strip.allFull', { count: allRows.value.length })
    : translate('submission.strip.folded', { count: fullCount.value }),
);
</script>

<template>
  <section v-if="isOneLine" id="cases" data-testid="cases-card" class="scroll-mt-20">
    <h2 class="sr-only">{{ $t('submission.cases.title') }}</h2>
    <p data-testid="cases-all-full" class="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted">
      {{ foldedText }}
      <AppButton size="sm" data-testid="cases-show-all" @click="isShowingAll = true">
        {{ $t('submission.strip.showAll', { count: allRows.length }) }}
      </AppButton>
    </p>
  </section>
  <section v-else id="cases" data-testid="cases-card" class="scroll-mt-20">
    <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pb-3">
      <h2 class="section-title">{{ $t('submission.cases.title') }}</h2>
      <span v-if="running" class="text-meta text-muted">{{ $t('submission.liveUpdates') }}</span>
      <div class="ml-auto flex flex-wrap items-center gap-2">
        <AppButton
          v-if="fullCount > 0"
          size="sm"
          data-testid="cases-show-all"
          :aria-pressed="isShowingAll"
          @click="isShowingAll = !isShowingAll"
        >
          {{
            isShowingAll
              ? $t('submission.strip.onlyLost')
              : $t('submission.strip.showAll', { count: allRows.length })
          }}
        </AppButton>
        <AppButton
          v-if="expandable.length > 0"
          size="sm"
          data-testid="cases-toggle-all"
          @click="toggleAll"
        >
          {{ allOpen ? $t('submission.cases.collapseAll') : $t('submission.cases.expandAll') }}
        </AppButton>
      </div>
    </div>
    <p v-if="isHidden" class="pb-6 text-muted">{{ $t('submission.casesHidden') }}</p>
    <div
      v-else-if="hasRows"
      tabindex="0"
      role="region"
      :aria-label="$t('submission.cases.scrollRegion')"
      class="overflow-x-auto focus-visible:-outline-offset-2"
    >
      <table class="w-full border-collapse text-sm max-sm:block sm:min-w-[560px] xl:min-w-0">
        <caption class="sr-only">
          {{
            $t('submission.cases.title')
          }}
        </caption>
        <thead class="max-sm:sr-only">
          <tr class="border-b border-line-strong text-left">
            <th
              v-for="column in COLUMN_KEYS"
              :key="column"
              scope="col"
              class="px-3"
              :class="[TABLE_HEAD_CELL, { 'text-right': column !== 'test' && column !== 'result' }]"
            >
              {{ $t(`submission.cases.${column}`) }}
            </th>
          </tr>
        </thead>
        <tbody class="max-sm:block">
          <tr
            v-if="isFolded"
            data-testid="cases-all-full"
            class="cursor-pointer border-b border-line hover:bg-surface-hover max-sm:block"
            @click="isShowingAll = true"
          >
            <td
              colspan="5"
              class="h-(--qh-row) px-3 text-muted max-sm:block max-sm:px-0 max-sm:py-3"
            >
              {{ foldedText }}
            </td>
          </tr>
          <template v-for="row in gradedRows" :key="row.key">
            <tr
              :id="row.key"
              data-testid="case-row"
              class="scroll-mt-20 border-b border-line"
              :class="[ROW_CARD, row.details.length > 0 && 'cursor-pointer hover:bg-surface-hover']"
              @click="row.details.length > 0 && toggle(row.key)"
            >
              <th
                scope="row"
                class="text-left font-mono font-normal max-sm:text-meta max-sm:text-muted"
                :class="[CELL, CELL_PLACES.test]"
              >
                <AppButton
                  tone="ghost"
                  size="sm"
                  v-if="row.details.length > 0"
                  class="font-mono"
                  :aria-expanded="isOpen(row.key)"
                  :aria-controls="`${row.key}-details`"
                  @click.stop="toggle(row.key)"
                >
                  <ChevronRight
                    aria-hidden="true"
                    class="size-3.5 text-muted transition-transform duration-(--qh-duration) ease-move"
                    :class="isOpen(row.key) && 'rotate-90'"
                  />
                  {{ row.label }}
                </AppButton>
                <template v-else>{{ row.label }}</template>
              </th>
              <td :class="[CELL, CELL_PLACES.result]">
                <VerdictChip :verdict="row.verdict" named />
              </td>
              <td :class="[NUMBER_CELL, CELL_PLACES.time]">{{ row.time }}</td>
              <td :class="[NUMBER_CELL, CELL_PLACES.memory]">{{ row.memory }}</td>
              <td :class="[NUMBER_CELL, CELL_PLACES.points, pointsClass(row.verdict)]">
                {{ row.points }}
              </td>
            </tr>
            <tr v-if="row.details.length > 0" :id="`${row.key}-details`" class="max-sm:block">
              <td colspan="5" class="p-0 max-sm:block">
                <FoldPanel :open="isOpen(row.key)">
                  <div class="px-3 pb-3 max-sm:px-0">
                    <CaseDetails :details="row.details" />
                  </div>
                </FoldPanel>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <p v-else class="pb-6 text-muted">
      {{ $t('submission.cases.none') }}
    </p>
    <slot name="footer" />
  </section>
</template>
