<script setup lang="ts">
import { computed, ref } from 'vue';
import type { SubmissionListItem } from '@/api/types/submissions';
import Card from '@/components/ui/Card.vue';
import Chip from '@/components/ui/Chip.vue';
import { CUE_TABLE_ROW } from '@/components/ui/cue-tones';
import ScrollRegion from '@/components/ScrollRegion.vue';
import LanguageLabel from '@/components/language/LanguageLabel.vue';
import UserLink from '@/components/UserLink.vue';
import { formatAgoCompact, formatDate } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import SubmissionCompactList from './SubmissionCompactList.vue';
import SubmissionPickBox from './SubmissionPickBox.vue';
import SubmissionProblemName from './SubmissionProblemName.vue';
import SubmissionSourceLink from './SubmissionSourceLink.vue';
import SubmissionVerdictCell from './SubmissionVerdictCell.vue';
import {
  BODY_CELL_CLASSES,
  COMPACT_BELOW_PX,
  FULL_TABLE_CLASS,
  HEADER_CELL_CLASSES,
  HEADER_ROW_CLASSES,
  NUMBER_CELLS,
  TABLE_CARD_CLASS,
  cellsOf,
  fullCellClass,
} from './submission-table-cells';
import type { CellKind, ColumnKey } from './submission-table-cells';
import { isFinished, scoreCellText, scoreCue } from './submission-row';
import { useRowOpen } from './row-open';
import { useIsNarrow } from './use-card-compact';
import { NO_VALUE, formatCaseMemory, formatCaseTime } from '@/lib/format';

/** The dense submission table: one line per row, the whole row opens the submission. Keep `SubmissionTableSkeleton.vue` in step: same card, header cells and row classes. */
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
    /** A contest's problems by code: the score reads as contest points over the contest problem's. */
    contestPoints?: Record<string, number>;
    /** Rows picked for the diff, in pick order; given only to signed-in viewers of the list page (shows the "Chọn" column). */
    pickedIds?: readonly string[];
    /** Rank of the first row; given, a leading "#" column numbers the rows (the best-submissions ranking). */
    rankStart?: number;
    /** The viewer's username: their rows are tinted (the best-submissions ranking). */
    ownUsername?: string;
  }>(),
  {
    showProblem: true,
    highlightIds: () => new Set<string>(),
    problemLabels: () => ({}),
    contestPoints: () => ({}),
    columnKeys: undefined,
    pickedIds: undefined,
    rankStart: undefined,
    ownUsername: undefined,
  },
);
const bodyCell = BODY_CELL_CLASSES;
const locale = useLocaleStore();
const emit = defineEmits<{ togglePick: [id: string] }>();
const { openRow, openRowInTab } = useRowOpen();
const card = ref<{ $el: HTMLElement } | null>(null);
const isCompact = useIsNarrow(() => card.value?.$el ?? null, COMPACT_BELOW_PX);
const isPicking = computed(() => props.pickedIds !== undefined);
const pickOrder = (id: string) => (props.pickedIds?.indexOf(id) ?? -1) + 1;
/** "2 minutes ago" does not need a tick every second. */
const RELATIVE_REFRESH_MS = 15_000;
const now = useNow(RELATIVE_REFRESH_MS);

const ALL_KEYS: readonly ColumnKey[] = ['verdict', 'problem', 'user', 'cost', 'language', 'when'];
const shownKeys = computed(() =>
  ALL_KEYS.filter(
    (key) =>
      (props.showProblem || key !== 'problem') &&
      (!props.columnKeys || props.columnKeys.includes(key)),
  ),
);
const cells = computed(() => cellsOf(shownKeys.value));
const isOwn = (row: SubmissionListItem) =>
  props.ownUsername !== undefined && row.user?.username === props.ownUsername;
const classOf = (kind: CellKind | 'pick' | 'source') => fullCellClass(kind);
const contestMaxOf = (row: SubmissionListItem) =>
  row.problem ? props.contestPoints[row.problem.code] : undefined;
const rowCue = (row: SubmissionListItem) => scoreCue(row, contestMaxOf(row));
const NUMBER_ALIGN = 'text-right font-mono tabular-nums whitespace-nowrap';
const timeText = (row: SubmissionListItem) =>
  isFinished(row) && row.time !== null ? formatCaseTime(row.time) : NO_VALUE;
const memoryText = (row: SubmissionListItem) =>
  isFinished(row) && row.memory !== null ? formatCaseMemory(row.memory) : NO_VALUE;
</script>

<template>
  <Card ref="card" as="div" data-testid="submission-table-card" :class="TABLE_CARD_CLASS">
    <SubmissionCompactList
      v-if="isCompact"
      :submissions="submissions"
      :columns="shownKeys"
      :highlight-ids="highlightIds"
      :problem-labels="problemLabels"
      :contest-points="contestPoints"
      :picked-ids="pickedIds"
      :rank-start="rankStart"
      :own-username="ownUsername"
      @toggle-pick="emit('togglePick', $event)"
    />
    <ScrollRegion v-else :label="$t('submissions.scrollRegion')">
      <table class="w-full border-collapse" :class="FULL_TABLE_CLASS">
        <caption class="sr-only">
          {{
            $t('submissions.listName')
          }}
        </caption>
        <thead>
          <tr :class="HEADER_ROW_CLASSES">
            <th v-if="isPicking" scope="col" :class="[HEADER_CELL_CLASSES, classOf('pick')]">
              {{ $t('sourceDiff.select.column') }}
            </th>
            <th
              v-if="rankStart !== undefined"
              scope="col"
              :class="[HEADER_CELL_CLASSES, 'w-14 text-right']"
            >
              {{ $t('submissions.columns.rank') }}
            </th>
            <th
              v-for="kind in cells"
              :key="kind"
              scope="col"
              :class="[
                HEADER_CELL_CLASSES,
                classOf(kind),
                { 'text-right': NUMBER_CELLS.has(kind) },
              ]"
            >
              {{ $t(`submissions.columns.${kind}`) }}
            </th>
            <th scope="col" :class="[HEADER_CELL_CLASSES, classOf('source')]">
              <span class="sr-only">{{ $t('submissions.columns.source') }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in submissions"
            :key="row.id"
            :data-id="row.id"
            class="cursor-pointer border-t border-line hover:bg-surface-hover"
            :class="[
              { 'row-added': highlightIds.has(row.id) },
              rowCue(row)
                ? CUE_TABLE_ROW[rowCue(row)!]
                : isOwn(row) && 'bg-accent-soft hover:bg-accent-soft',
            ]"
            @click="openRow($event, row.id)"
            @auxclick="openRowInTab($event, row.id)"
          >
            <td v-if="isPicking" :class="bodyCell">
              <SubmissionPickBox
                :id="row.id"
                :order="pickOrder(row.id)"
                :picked-count="pickedIds?.length ?? 0"
                @toggle="emit('togglePick', $event)"
              />
            </td>
            <td
              v-if="rankStart !== undefined"
              :class="[bodyCell, 'text-right font-semibold text-muted tabular-nums']"
            >
              {{ rankStart + index }}
            </td>
            <template v-for="kind in cells" :key="kind">
              <td v-if="kind === 'verdict'" :class="[bodyCell, classOf(kind)]">
                <SubmissionVerdictCell :row="row" />
              </td>
              <td v-else-if="kind === 'score'" :class="[bodyCell, classOf(kind), NUMBER_ALIGN]">
                <Chip v-if="rowCue(row)" :tone="rowCue(row)!" class="font-mono tabular-nums">{{
                  scoreCellText(row, locale.locale, contestMaxOf(row))
                }}</Chip>
                <template v-else>{{
                  scoreCellText(row, locale.locale, contestMaxOf(row))
                }}</template>
              </td>
              <td v-else-if="kind === 'problem'" :class="[bodyCell, 'w-full max-w-0']">
                <SubmissionProblemName
                  :problem="row.problem"
                  :label="row.problem ? problemLabels[row.problem.code] : undefined"
                  show-code
                />
              </td>
              <td v-else-if="kind === 'user'" :class="[bodyCell, classOf(kind), 'max-w-0']">
                <UserLink v-if="row.user" :username="row.user.username" :rating="row.user.rating" />
                <template v-else>{{ NO_VALUE }}</template>
              </td>
              <td
                v-else-if="kind === 'time'"
                :class="[bodyCell, classOf(kind), NUMBER_ALIGN, 'text-muted']"
              >
                {{ timeText(row) }}
              </td>
              <td
                v-else-if="kind === 'memory'"
                :class="[bodyCell, classOf(kind), NUMBER_ALIGN, 'text-muted']"
              >
                {{ memoryText(row) }}
              </td>
              <td
                v-else-if="kind === 'language'"
                :class="[bodyCell, classOf(kind), 'text-muted']"
                :title="row.language?.name"
              >
                <LanguageLabel v-if="row.language" :language="row.language" />
                <template v-else>{{ NO_VALUE }}</template>
              </td>
              <td v-else :class="[bodyCell, classOf(kind), 'whitespace-nowrap text-muted']">
                <time
                  :datetime="row.date"
                  :title="formatDate(row.date, 'datetime', locale.locale)"
                  >{{ formatAgoCompact(row.date, now, locale.locale) }}</time
                >
              </td>
            </template>
            <td :class="bodyCell"><SubmissionSourceLink :id="row.id" /></td>
          </tr>
        </tbody>
      </table>
    </ScrollRegion>
  </Card>
</template>
