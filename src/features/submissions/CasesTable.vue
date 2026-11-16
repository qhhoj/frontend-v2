<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ChevronRight } from 'lucide-vue-next';
import { useRoute } from 'vue-router';
import type { SubmissionBatch, SubmissionCase } from '@/api/types/submissions';
import AppButton from '@/components/ui/AppButton.vue';
import FoldPanel from '@/components/ui/FoldPanel.vue';
import VerdictChip from '@/components/ui/VerdictChip.vue';
import { translate } from '@/i18n';
import CaseDetails from './CaseDetails.vue';
import { caseDetails, type CaseDetail } from './case-details';
import { NO_VALUE, formatCaseMemory, formatCaseTime } from '@/lib/format';
import { PARTIAL_CODE, caseVerdictOf, type Verdict } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import { formatCasePoints, isFullCase, pendingPositions } from './test-overview';

/**
 * The result card ("Kết quả chấm"): the compile log, one row per test, then the `footer` slot (the subtasks and the total,
 * `TestOverview.vue`). Keep `CasesTableSkeleton.vue` in step: same card, header cells and row classes. Below `sm` the same rows lay out as cards
 * (test, verdict and points, then time and memory), so each test keeps one `#case-<n>` anchor. Cells pad 24 px on the left, the same edge as the card title.
 */
const props = defineProps<{
  cases: SubmissionCase[] | null;
  batches: SubmissionBatch[] | null;
  /** The problem's test count, null when the viewer may not see case results. */
  totalCases: number | null;
  /** The row is being graded live: the tests not graded yet are listed as waiting and results arrive by themselves. */
  running: boolean;
  /** The compile log of a compile error. Text only. */
  compileError?: string | null;
  /** A compile error whose log this viewer may not read (it quotes the code): said instead of "no test results". */
  compileLogHidden?: boolean;
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
const route = useRoute();
/** A link to one test (`#case-<n>`, from the test squares) opens that test. */
onMounted(() => {
  if (!route.hash.startsWith('#case-')) return;
  opened.value.add(route.hash.slice(1));
  isShowingAll.value = true;
});

const allRows = computed(() =>
  props.cases ? props.cases.map(caseRow) : (props.batches ?? []).map(batchRow),
);
/** The ledger lists the tests that lost points; "Hiện tất cả" adds the full ones. A link to one test (`#case-<n>`) shows all. */
const isShowingAll = ref(false);
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
const pendingNumbers = computed(() =>
  pendingPositions(props.cases, props.totalCases, props.running),
);
/** The phone card grid of a row and where each cell sits in it; from `sm` up they are plain table cells. */
const ROW_CARD =
  'max-sm:grid max-sm:grid-cols-[auto_minmax(0,1fr)_auto] max-sm:items-center max-sm:gap-x-2.5 max-sm:gap-y-0.5 max-sm:py-2.5';
const CELL = 'px-3 py-3 max-sm:p-0';
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
const hasRows = computed(() => allRows.value.length > 0 || pendingNumbers.value.length > 0);
const isHidden = computed(
  () => props.cases === null && props.batches === null && !props.compileError,
);
</script>

<template>
  <section id="cases" data-testid="cases-card" class="scroll-mt-20">
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
    <div v-if="compileError" class="pb-4">
      <p class="text-meta text-muted">{{ $t('submission.cases.compileLog') }}</p>
      <pre
        class="mt-1.5 max-h-96 overflow-auto rounded-cell bg-surface-strong p-4 font-mono text-meta leading-relaxed whitespace-pre"
        >{{ compileError }}</pre>
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
          <tr class="text-left text-meta text-muted">
            <th
              v-for="column in COLUMN_KEYS"
              :key="column"
              scope="col"
              class="px-3 py-3 font-medium whitespace-nowrap"
              :class="{ 'text-right': column !== 'test' && column !== 'result' }"
            >
              {{ $t(`submission.cases.${column}`) }}
            </th>
          </tr>
        </thead>
        <tbody class="max-sm:block">
          <tr
            v-if="!gradedRows.length && !pendingNumbers.length"
            data-testid="cases-all-full"
            class="border-t border-line max-sm:block"
          >
            <td colspan="5" class="py-3 text-muted max-sm:block">
              {{ $t('submission.strip.allFull', { count: allRows.length }) }}
            </td>
          </tr>
          <template v-for="row in gradedRows" :key="row.key">
            <tr
              :id="row.key"
              data-testid="case-row"
              class="scroll-mt-20 border-t border-line"
              :class="[
                ROW_CARD,
                row.details.length > 0 && 'cursor-pointer hover:bg-surface-strong',
              ]"
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
          <tr
            v-for="number in pendingNumbers"
            :key="`pending-${number}`"
            data-testid="pending-row"
            class="border-t border-line text-muted"
            :class="ROW_CARD"
          >
            <th
              scope="row"
              class="text-left font-mono font-normal"
              :class="[CELL, CELL_PLACES.test]"
            >
              {{ number }}
            </th>
            <td :class="[CELL, CELL_PLACES.result]">{{ $t('submission.cases.pending') }}</td>
            <td :class="[NUMBER_CELL, CELL_PLACES.time]">{{ NO_VALUE }}</td>
            <td :class="[NUMBER_CELL, CELL_PLACES.memory]">{{ NO_VALUE }}</td>
            <td :class="[NUMBER_CELL, CELL_PLACES.points]">{{ NO_VALUE }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else-if="compileLogHidden" class="pb-6 text-muted">
      {{ $t('submission.cases.compileLogHidden') }}
    </p>
    <p v-else-if="!compileError" class="pb-6 text-muted">
      {{ $t('submission.cases.none') }}
    </p>
    <slot name="footer" />
  </section>
</template>
