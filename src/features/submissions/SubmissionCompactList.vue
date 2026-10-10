<script setup lang="ts">
import type { SubmissionListItem } from '@/api/types/submissions';
import UserName from '@/components/UserName.vue';
import { formatAgoCompact, formatDateTime } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import SubmissionPickBox from './SubmissionPickBox.vue';
import SubmissionProblemName from './SubmissionProblemName.vue';
import SubmissionSourceLink from './SubmissionSourceLink.vue';
import SubmissionVerdictBlock from './SubmissionVerdictBlock.vue';
import type { ColumnKey } from './submission-table-cells';
import { costText } from './submission-row';
import { useRowOpen } from './row-open';

/**
 * The submissions list for a narrow card (a phone, a tablet beside the filter rail): the verdict block, then up to three lines:
 * problem; user and age; language and cost. Shows the same columns as the table would. Keep `SubmissionTableSkeleton.vue` in step.
 */
const props = defineProps<{
  submissions: SubmissionListItem[];
  columns: readonly ColumnKey[];
  highlightIds: ReadonlySet<string>;
  problemLabels: Record<string, string>;
  pickedIds?: readonly string[];
}>();
const emit = defineEmits<{ togglePick: [id: string] }>();
const locale = useLocaleStore();
const { openRow, openRowInTab } = useRowOpen();
const RELATIVE_REFRESH_MS = 15_000;
const now = useNow(RELATIVE_REFRESH_MS);
const isShown = (key: ColumnKey) => props.columns.includes(key);
const pickOrder = (id: string) => (props.pickedIds?.indexOf(id) ?? -1) + 1;
/** The third line: language and cost, whichever of them the list shows. */
const detailsOf = (row: SubmissionListItem) =>
  [
    isShown('language') ? row.language?.name : undefined,
    isShown('cost') ? costText(row) : undefined,
  ]
    .filter(Boolean)
    .join(' · ');
</script>

<template>
  <ul :aria-label="$t('submissions.listName')" class="m-0 list-none p-0">
    <li
      v-for="row in submissions"
      :key="row.id"
      :data-id="row.id"
      class="flex cursor-pointer items-center gap-3 border-t border-line px-3 py-2.5 first:border-t-0 hover:bg-surface-hover"
      :class="{ 'row-added': highlightIds.has(row.id) }"
      @click="openRow($event, row.id)"
      @auxclick="openRowInTab($event, row.id)"
    >
      <SubmissionVerdictBlock :row="row" compact class="shrink-0" />
      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <SubmissionProblemName
          v-if="isShown('problem')"
          :problem="row.problem"
          :label="row.problem ? problemLabels[row.problem.code] : undefined"
        />
        <div class="flex gap-1.5 text-[13px] whitespace-nowrap text-muted">
          <UserName
            v-if="isShown('user') && row.user"
            :username="row.user.username"
            :rating="row.user.rating"
            class="min-w-0 truncate"
          />
          <span v-if="isShown('user') && isShown('when')" aria-hidden="true">·</span>
          <time
            v-if="isShown('when')"
            :datetime="row.date"
            :title="formatDateTime(row.date, locale.locale)"
            >{{ formatAgoCompact(row.date, now, locale.locale) }}</time
          >
        </div>
        <div v-if="detailsOf(row)" class="truncate font-mono text-xs text-muted">
          {{ detailsOf(row) }}
        </div>
      </div>
      <SubmissionPickBox
        v-if="pickedIds"
        :id="row.id"
        :order="pickOrder(row.id)"
        :picked-count="pickedIds.length"
        @toggle="emit('togglePick', $event)"
      />
      <SubmissionSourceLink :id="row.id" class="shrink-0" />
    </li>
  </ul>
</template>
