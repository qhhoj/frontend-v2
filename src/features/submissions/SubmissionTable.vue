<script setup lang="ts">
import { Code } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
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
  COLUMN_WIDTH_CLASS,
  FULL_TABLE_CLASS,
  HEADER_CELL_CLASSES,
} from './submission-table-cells';
import type { ColumnKey } from './submission-table-cells';
import DeletedProblemChip from './DeletedProblemChip.vue';
import { MAX_DIFF_PICKS } from './diff-picks';
import { submissionShortId } from './submission-short-id';

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
    /** Rows picked for the diff, in pick order; given only to signed-in viewers of the list page (shows the "Chọn" column). */
    pickedIds?: readonly string[];
  }>(),
  {
    showProblem: true,
    highlightIds: () => new Set<string>(),
    problemLabels: () => ({}),
    columnKeys: undefined,
    pickedIds: undefined,
  },
);
const locale = useLocaleStore();
const emit = defineEmits<{ togglePick: [id: string] }>();
const router = useRouter();
/** Clicks that start on a link, button or box keep their own action; the rest of the row opens the submission. */
const OWN_ACTION = 'a, button, input, label';
function openRow(event: MouseEvent, id: string) {
  if ((event.target as Element).closest(OWN_ACTION)) return;
  const location = { name: 'submission', params: { id } };
  if (event.ctrlKey || event.metaKey) window.open(router.resolve(location).href, '_blank');
  else void router.push(location);
}
/** A middle click opens the submission in a new tab, as it would on the verdict link. */
function openRowInTab(event: MouseEvent, id: string) {
  if (event.button !== 1 || (event.target as Element).closest(OWN_ACTION)) return;
  window.open(router.resolve({ name: 'submission', params: { id } }).href, '_blank');
}
const isPicking = computed(() => props.pickedIds !== undefined);
const pickOrder = (id: string) => (props.pickedIds?.indexOf(id) ?? -1) + 1;
/** A third box is refused (`aria-disabled`): the click is cancelled so the box does not tick. */
const isPickBlocked = (id: string) =>
  (props.pickedIds?.length ?? 0) >= MAX_DIFF_PICKS && pickOrder(id) === 0;
function onPickClick(event: MouseEvent, id: string) {
  if (isPickBlocked(id)) event.preventDefault();
  else emit('togglePick', id);
}
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
/** Only the full table has fixed column widths. */
const widthOf = (key: keyof typeof COLUMN_WIDTH_CLASS) =>
  props.columnKeys ? '' : COLUMN_WIDTH_CLASS[key];
</script>

<template>
  <GlassCard as="div" data-testid="submission-table-card" class="overflow-hidden">
    <div
      tabindex="0"
      role="region"
      :aria-label="$t('submissions.scrollRegion')"
      class="overflow-x-auto focus-visible:-outline-offset-2"
    >
      <table class="w-full border-collapse text-[15px]" :class="columnKeys ? '' : FULL_TABLE_CLASS">
        <caption class="sr-only">
          {{
            $t('submissions.listName')
          }}
        </caption>
        <thead>
          <tr class="text-left text-[13px] text-muted">
            <th v-if="isPicking" scope="col" :class="[HEADER_CELL_CLASSES, widthOf('pick')]">
              {{ $t('sourceDiff.select.column') }}
            </th>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :class="[HEADER_CELL_CLASSES, widthOf(column.key), { 'text-right': column.isNumber }]"
            >
              {{ $t(`submissions.columns.${column.key}`) }}
            </th>
            <th scope="col" :class="[HEADER_CELL_CLASSES, widthOf('source')]">
              <span class="sr-only">{{ $t('submissions.columns.source') }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in submissions"
            :key="row.id"
            :data-id="row.id"
            class="cursor-pointer border-t border-line hover:bg-surface-hover"
            :class="{ 'row-added': highlightIds.has(row.id) }"
            @click="openRow($event, row.id)"
            @auxclick="openRowInTab($event, row.id)"
          >
            <td v-if="isPicking" :class="BODY_CELL_CLASSES">
              <label class="relative inline-flex size-11 items-center justify-center">
                <input
                  type="checkbox"
                  class="size-5"
                  :checked="pickOrder(row.id) > 0"
                  :aria-disabled="isPickBlocked(row.id) || undefined"
                  :aria-label="$t('sourceDiff.select.label', { id: submissionShortId(row.id) })"
                  @click="onPickClick($event, row.id)"
                />
                <span
                  v-if="pickOrder(row.id) > 0"
                  data-testid="pick-order"
                  aria-hidden="true"
                  class="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-pill bg-gradient-accent text-[11px] font-bold text-on-accent"
                  >{{ pickOrder(row.id) }}</span
                >
              </label>
            </td>
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
                <span v-if="row.problem.isDeleted" class="font-semibold text-content"
                  >{{ row.problem.name }} <DeletedProblemChip
                /></span>
                <RouterLink
                  v-else
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
            <td :class="BODY_CELL_CLASSES">
              <RouterLink
                :to="{ name: 'submission', params: { id: row.id }, hash: '#source' }"
                :aria-label="$t('submissions.viewSource')"
                :title="$t('submissions.viewSource')"
                class="inline-flex size-7 items-center justify-center rounded-pill text-muted hover:bg-surface-hover hover:text-content"
              >
                <Code class="size-4" aria-hidden="true" />
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </GlassCard>
</template>
