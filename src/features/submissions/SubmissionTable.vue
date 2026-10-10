<script setup lang="ts">
import { computed, ref } from 'vue';
import type { SubmissionListItem } from '@/api/types/submissions';
import GlassCard from '@/components/GlassCard.vue';
import ScrollRegion from '@/components/ScrollRegion.vue';
import UserName from '@/components/UserName.vue';
import { formatDateTime, formatAgoCompact } from '@/lib/format';
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
/** Only the full table has fixed column widths and tiers. */
const tierOf = (key: ColumnKey) => (props.columnKeys ? '' : (COLUMN_TIER_CLASS[key] ?? ''));
const widthOf = (key: ColumnSlot) => fullColumnClass(key, !props.columnKeys);
</script>

<template>
  <GlassCard ref="card" as="div" data-testid="submission-table-card" :class="TABLE_CARD_CLASS">
    <SubmissionCompactList
      v-if="isCompact"
      :submissions="submissions"
      :columns="shownKeys"
      :highlight-ids="highlightIds"
      :problem-labels="problemLabels"
      :picked-ids="pickedIds"
      @toggle-pick="emit('togglePick', $event)"
    />
    <ScrollRegion v-else :label="$t('submissions.scrollRegion')">
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
              <SubmissionPickBox
                :id="row.id"
                :order="pickOrder(row.id)"
                :picked-count="pickedIds?.length ?? 0"
                @toggle="emit('togglePick', $event)"
              />
            </td>
            <td :class="BODY_CELL_CLASSES"><SubmissionVerdictBlock :row="row" /></td>
            <td v-if="isShown('problem')" :class="[BODY_CELL_CLASSES, 'w-full max-w-0']">
              <SubmissionProblemName
                :problem="row.problem"
                :label="row.problem ? problemLabels[row.problem.code] : undefined"
              />
            </td>
            <td v-if="isShown('user')" :class="[BODY_CELL_CLASSES, 'max-w-0']">
              <UserName
                v-if="row.user"
                :username="row.user.username"
                :rating="row.user.rating"
                :title="row.user.username"
                class="block truncate"
              />
              <template v-else>{{ NO_VALUE }}</template>
            </td>
            <td
              v-if="isShown('cost')"
              :class="[
                BODY_CELL_CLASSES,
                tierOf('cost'),
                'text-right font-mono text-[13px] whitespace-nowrap text-muted tabular-nums',
              ]"
            >
              {{ costText(row) }}
            </td>
            <td
              v-if="isShown('language')"
              :class="[BODY_CELL_CLASSES, tierOf('language'), 'truncate text-muted']"
              :title="row.language?.name"
            >
              {{ row.language?.name ?? NO_VALUE }}
            </td>
            <td
              v-if="isShown('when')"
              :class="[BODY_CELL_CLASSES, tierOf('when'), 'whitespace-nowrap text-muted']"
            >
              <time :datetime="row.date" :title="formatDateTime(row.date, locale.locale)">{{
                formatAgoCompact(row.date, now, locale.locale)
              }}</time>
            </td>
            <td :class="BODY_CELL_CLASSES"><SubmissionSourceLink :id="row.id" /></td>
          </tr>
        </tbody>
      </table>
    </ScrollRegion>
  </GlassCard>
</template>
