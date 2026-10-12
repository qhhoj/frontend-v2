<script setup lang="ts">
import type { SubmissionListItem } from '@/api/types/submissions';
import UserLink from '@/components/UserLink.vue';
import { formatAgoCompact, formatDateTime } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import SubmissionPickBox from './SubmissionPickBox.vue';
import SubmissionProblemName from './SubmissionProblemName.vue';
import SubmissionSourceLink from './SubmissionSourceLink.vue';
import SubmissionVerdictBlock from './SubmissionVerdictBlock.vue';
import type { ColumnKey } from './submission-table-cells';
import { NO_VALUE, costText } from './submission-row';
import { useRowOpen } from './row-open';

/**
 * The submissions list for a narrow card (a phone, a tablet beside the filter rail): the verdict block, then up to four lines:
 * problem; user; age and language; and, once judged, time and memory. Shows the same columns as the table would. Keep `SubmissionTableSkeleton.vue` in step.
 */
const props = defineProps<{
  submissions: SubmissionListItem[];
  columns: readonly ColumnKey[];
  highlightIds: ReadonlySet<string>;
  problemLabels: Record<string, string>;
  pickedIds?: readonly string[];
  rankStart?: number;
  ownUsername?: string;
}>();
const emit = defineEmits<{ togglePick: [id: string] }>();
const locale = useLocaleStore();
const { openRow, openRowInTab } = useRowOpen();
const RELATIVE_REFRESH_MS = 15_000;
const now = useNow(RELATIVE_REFRESH_MS);
const isShown = (key: ColumnKey) => props.columns.includes(key);
const pickOrder = (id: string) => (props.pickedIds?.indexOf(id) ?? -1) + 1;
/** The last line: time and memory, for a finished row only (an unfinished one has nothing to say there). */
const costOf = (row: SubmissionListItem) =>
  isShown('cost') && costText(row) !== NO_VALUE ? costText(row) : '';
</script>

<template>
  <ul :aria-label="$t('submissions.listName')" class="m-0 list-none p-0">
    <li
      v-for="(row, index) in submissions"
      :key="row.id"
      :data-id="row.id"
      class="flex cursor-pointer items-center gap-3 border-t border-line px-3 py-2.5 first:border-t-0 hover:bg-surface-hover"
      :class="{
        'row-added': highlightIds.has(row.id),
        'bg-accent-soft hover:bg-accent-soft':
          ownUsername !== undefined && row.user?.username === ownUsername,
      }"
      @click="openRow($event, row.id)"
      @auxclick="openRowInTab($event, row.id)"
    >
      <span
        v-if="rankStart !== undefined"
        class="w-6 shrink-0 self-start text-right text-sm leading-12 font-semibold text-muted tabular-nums"
        >{{ rankStart + index }}</span
      >
      <SubmissionVerdictBlock :row="row" compact class="shrink-0 self-start" />
      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <SubmissionProblemName
          v-if="isShown('problem')"
          :problem="row.problem"
          :label="row.problem ? problemLabels[row.problem.code] : undefined"
        />
        <div v-if="isShown('user') && row.user" class="flex min-w-0 text-meta">
          <UserLink :username="row.user.username" :rating="row.user.rating" />
        </div>
        <div
          v-if="isShown('when') || isShown('language')"
          class="flex min-w-0 items-center gap-1.5 text-xs whitespace-nowrap text-muted"
        >
          <time
            v-if="isShown('when')"
            class="shrink-0"
            :datetime="row.date"
            :title="formatDateTime(row.date, locale.locale)"
            >{{ formatAgoCompact(row.date, now, locale.locale) }}</time
          >
          <span v-if="isShown('when') && isShown('language')" aria-hidden="true">·</span>
          <span v-if="isShown('language')" class="truncate" :title="row.language?.name">{{
            row.language?.name ?? NO_VALUE
          }}</span>
        </div>
        <div v-if="costOf(row)" class="font-mono text-xs whitespace-nowrap text-muted">
          {{ costOf(row) }}
        </div>
      </div>
      <!-- Stacked, not side by side: on a phone every pixel beside them goes to the problem name. -->
      <div class="flex shrink-0 flex-col items-center">
        <SubmissionPickBox
          v-if="pickedIds"
          :id="row.id"
          :order="pickOrder(row.id)"
          :picked-count="pickedIds.length"
          @toggle="emit('togglePick', $event)"
        />
        <SubmissionSourceLink :id="row.id" />
      </div>
    </li>
  </ul>
</template>
