<script setup lang="ts">
import { computed, ref } from 'vue';
import type { SubmissionListItem } from '@/api/types/submissions';
import Card from '@/components/ui/Card.vue';
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
import SubmissionVerdictBlock from './SubmissionVerdictBlock.vue';
import {
  BODY_CELL_CLASSES,
  COLUMN_TIER_CLASS,
  HEADER_ROW_CLASSES,
  COMPACT_BELOW_PX,
  FULL_TABLE_CLASS,
  HEADER_CELL_CLASSES,
  TABLE_CARD_CLASS,
  fullColumnClass,
} from './submission-table-cells';
import type { ColumnKey, ColumnSlot } from './submission-table-cells';
import { NO_VALUE, costText } from './submission-row';
import { useRowOpen } from './row-open';
import { useIsNarrow } from './use-card-compact';

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
    /** Rank of the first row; given, a leading "#" column numbers the rows (the best-submissions ranking). */
    rankStart?: number;
    /** The viewer's username: their rows are tinted (the best-submissions ranking). */
    ownUsername?: string;
    /** The problem code after its name, in muted mono. */
    showProblemCode?: boolean;
  }>(),
  {
    showProblem: true,
    highlightIds: () => new Set<string>(),
    problemLabels: () => ({}),
    columnKeys: undefined,
    pickedIds: undefined,
    rankStart: undefined,
    ownUsername: undefined,
    showProblemCode: false,
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

const COLUMNS = [
  { key: 'verdict', isNumber: false },
  { key: 'problem', isNumber: false },
  { key: 'user', isNumber: false },
  { key: 'cost', isNumber: true },
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
const shownKeys = computed(() => columns.value.map((column) => column.key));
const isOwn = (row: SubmissionListItem) =>
  props.ownUsername !== undefined && row.user?.username === props.ownUsername;
/** Only the full table has fixed column widths and tiers. */
const tierOf = (key: ColumnKey) => (props.columnKeys ? '' : (COLUMN_TIER_CLASS[key] ?? ''));
const widthOf = (key: ColumnSlot) => fullColumnClass(key, !props.columnKeys);
</script>

<template>
  <Card ref="card" as="div" data-testid="submission-table-card" :class="TABLE_CARD_CLASS">
    <SubmissionCompactList
      v-if="isCompact"
      :submissions="submissions"
      :columns="shownKeys"
      :highlight-ids="highlightIds"
      :problem-labels="problemLabels"
      :picked-ids="pickedIds"
      :rank-start="rankStart"
      :own-username="ownUsername"
      @toggle-pick="emit('togglePick', $event)"
    />
    <ScrollRegion v-else :label="$t('submissions.scrollRegion')">
      <table class="w-full border-collapse text-sm" :class="columnKeys ? '' : FULL_TABLE_CLASS">
        <caption class="sr-only">
          {{
            $t('submissions.listName')
          }}
        </caption>
        <thead>
          <tr :class="HEADER_ROW_CLASSES">
            <th v-if="isPicking" scope="col" :class="[HEADER_CELL_CLASSES, widthOf('pick')]">
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
            v-for="(row, index) in submissions"
            :key="row.id"
            :data-id="row.id"
            class="cursor-pointer border-t border-line hover:bg-surface-hover"
            :class="{
              'row-added': highlightIds.has(row.id),
              'bg-accent-soft hover:bg-accent-soft': isOwn(row),
            }"
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
            <td :class="bodyCell"><SubmissionVerdictBlock :row="row" /></td>
            <td v-if="isShown('problem')" :class="[bodyCell, 'w-full max-w-0']">
              <SubmissionProblemName
                :problem="row.problem"
                :label="row.problem ? problemLabels[row.problem.code] : undefined"
                :show-code="showProblemCode"
              />
            </td>
            <td v-if="isShown('user')" :class="[bodyCell, 'max-w-0']">
              <UserLink v-if="row.user" :username="row.user.username" :rating="row.user.rating" />
              <template v-else>{{ NO_VALUE }}</template>
            </td>
            <td
              v-if="isShown('cost')"
              :class="[
                bodyCell,
                tierOf('cost'),
                'text-right font-mono text-meta whitespace-nowrap text-muted tabular-nums',
              ]"
            >
              {{ costText(row) }}
            </td>
            <td
              v-if="isShown('language')"
              :class="[bodyCell, tierOf('language'), 'truncate text-muted']"
              :title="row.language?.name"
            >
              <LanguageLabel v-if="row.language" :language="row.language" />
              <template v-else>{{ NO_VALUE }}</template>
            </td>
            <td
              v-if="isShown('when')"
              :class="[bodyCell, tierOf('when'), 'whitespace-nowrap text-muted']"
            >
              <time :datetime="row.date" :title="formatDate(row.date, 'datetime', locale.locale)">{{
                formatAgoCompact(row.date, now, locale.locale)
              }}</time>
            </td>
            <td :class="bodyCell"><SubmissionSourceLink :id="row.id" /></td>
          </tr>
        </tbody>
      </table>
    </ScrollRegion>
  </Card>
</template>
