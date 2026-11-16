<script setup lang="ts">
import type { SubmissionListItem } from '@/api/types/submissions';
import Chip from '@/components/ui/Chip.vue';
import { CUE_ROW } from '@/components/ui/cue-tones';
import LanguageLabel from '@/components/language/LanguageLabel.vue';
import UserLink from '@/components/UserLink.vue';
import { NO_VALUE, formatCaseMemory, formatCaseTime } from '@/lib/format';
import { formatAgoCompact, formatDate } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import SubmissionPickBox from './SubmissionPickBox.vue';
import SubmissionProblemName from './SubmissionProblemName.vue';
import SubmissionSourceLink from './SubmissionSourceLink.vue';
import SubmissionVerdictCell from './SubmissionVerdictCell.vue';
import { ROW_RULE } from './submission-table-cells';
import type { ColumnKey, TableVariant } from './submission-table-cells';
import { isFinished, scoreCellText, scoreCue } from './submission-row';
import { useRowOpen } from './row-open';

/**
 * The submissions list for a narrow card (a phone, a tablet beside the filter rail): two lines per row. First the verdict chip
 * and the problem; then "score · time · memory · when · user · language", each only if its column is shown and the row has it.
 * The whole row opens the submission. Keep `SubmissionTableSkeleton.vue` in step.
 */
const props = defineProps<{
  submissions: SubmissionListItem[];
  columns: readonly ColumnKey[];
  highlightIds: ReadonlySet<string>;
  problemLabels: Record<string, string>;
  contestPoints: Record<string, number>;
  pickedIds?: readonly string[];
  rankStart?: number;
  ownUsername?: string;
  /** `ledger`: the rows sit on the page (no side padding, a rule under each); `surface`: inside a card. */
  variant?: TableVariant;
}>();
const emit = defineEmits<{ togglePick: [id: string] }>();
const locale = useLocaleStore();
const { openRow, openRowInTab } = useRowOpen();
const RELATIVE_REFRESH_MS = 15_000;
const now = useNow(RELATIVE_REFRESH_MS);
const isShown = (key: ColumnKey) => props.columns.includes(key);
const pickOrder = (id: string) => (props.pickedIds?.indexOf(id) ?? -1) + 1;
const contestMaxOf = (row: SubmissionListItem) =>
  row.problem ? props.contestPoints[row.problem.code] : undefined;
const rowCue = (row: SubmissionListItem) => scoreCue(row, contestMaxOf(row));
const scoreOf = (row: SubmissionListItem) => scoreCellText(row, locale.locale, contestMaxOf(row));
/** Time and memory of a finished row only: an unfinished one has nothing to say there. */
const timeOf = (row: SubmissionListItem) =>
  isFinished(row) && row.time !== null ? formatCaseTime(row.time) : '';
const memoryOf = (row: SubmissionListItem) =>
  isFinished(row) && row.memory !== null ? formatCaseMemory(row.memory) : '';
</script>

<template>
  <ul :aria-label="$t('submissions.listName')" class="m-0 list-none p-0">
    <li
      v-for="(row, index) in submissions"
      :key="row.id"
      :data-id="row.id"
      class="flex min-h-(--qh-row) cursor-pointer items-center gap-2 py-2 hover:bg-surface-hover"
      :class="[
        variant === 'surface' ? 'px-3 first:border-t-0' : 'px-2',
        ROW_RULE[variant ?? 'ledger'],
        { 'row-added': highlightIds.has(row.id) },
        rowCue(row)
          ? CUE_ROW[rowCue(row)!]
          : ownUsername !== undefined &&
            row.user?.username === ownUsername &&
            'bg-accent-soft hover:bg-accent-soft',
      ]"
      @click="openRow($event, row.id)"
      @auxclick="openRowInTab($event, row.id)"
    >
      <span
        v-if="rankStart !== undefined"
        class="w-6 shrink-0 self-start text-right text-sm leading-5 font-semibold text-muted tabular-nums"
        >{{ rankStart + index }}</span
      >
      <SubmissionPickBox
        v-if="pickedIds"
        :id="row.id"
        :order="pickOrder(row.id)"
        :picked-count="pickedIds.length"
        @toggle="emit('togglePick', $event)"
      />
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <div class="flex min-w-0 items-center gap-2 text-sm">
          <SubmissionVerdictCell v-if="isShown('verdict')" :row="row" class="shrink-0" />
          <template v-if="isShown('verdict') && scoreOf(row)">
            <Chip v-if="rowCue(row)" :tone="rowCue(row)!" class="shrink-0 font-mono tabular-nums">{{
              scoreOf(row)
            }}</Chip>
            <span v-else class="shrink-0 font-mono text-caption text-muted tabular-nums">{{
              scoreOf(row)
            }}</span>
          </template>
          <SubmissionProblemName
            v-if="isShown('problem')"
            class="min-w-0 flex-1"
            :problem="row.problem"
            :label="row.problem ? problemLabels[row.problem.code] : undefined"
          />
        </div>
        <p
          class="m-0 flex min-w-0 items-center gap-1 overflow-hidden text-caption leading-4 whitespace-nowrap text-muted [&>*+*]:before:mr-1 [&>*+*]:before:content-['·']"
        >
          <template
            v-for="(part, partIndex) in [
              { text: isShown('cost') ? timeOf(row) : '' },
              { text: isShown('cost') ? memoryOf(row) : '' },
            ].filter((part) => part.text)"
            :key="partIndex"
          >
            <span class="shrink-0 font-mono tabular-nums">{{ part.text }}</span>
          </template>
          <template v-if="isShown('when')">
            <time
              class="shrink-0"
              :datetime="row.date"
              :title="formatDate(row.date, 'datetime', locale.locale)"
              >{{ formatAgoCompact(row.date, now, locale.locale) }}</time
            >
          </template>
          <template v-if="isShown('user') && row.user">
            <UserLink
              class="shrink-[2] !min-w-16"
              :username="row.user.username"
              :rating="row.user.rating"
            />
          </template>
          <template v-if="isShown('language')">
            <LanguageLabel
              v-if="row.language"
              class="min-w-0 shrink-[8]"
              :language="row.language"
              :title="row.language.name"
            />
            <span v-else>{{ NO_VALUE }}</span>
          </template>
        </p>
      </div>
      <SubmissionSourceLink :id="row.id" class="shrink-0" />
    </li>
  </ul>
</template>
