<script setup lang="ts">
import type { SubmissionListItem } from '@/api/types/submissions';
import LanguageLabel from '@/components/language/LanguageLabel.vue';
import UserLink from '@/components/UserLink.vue';
import { formatCaseMemory, formatCaseTime } from '@/lib/format';
import { formatAgoCompact, formatDate } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import SubmissionPickBox from './SubmissionPickBox.vue';
import SubmissionProblemName from './SubmissionProblemName.vue';
import SubmissionScore from './SubmissionScore.vue';
import SubmissionVerdictCell from './SubmissionVerdictCell.vue';
import { OWN_BAR, ROW_RULE } from './submission-table-cells';
import type { ColumnKey, TableVariant } from './submission-table-cells';
import { isFinished } from './submission-row';
import { useRowOpen } from './row-open';

/**
 * The submissions list on a phone: 52 px rows. The verdict with the score under it, then the problem (its own part of
 * the name, a link to the problem) over one muted line (who and the time; where the list leaves the name out: time, memory and language;
 * each only if its column is shown and the row has it), and when at the end. The
 * whole row opens the submission; the viewer's own rows carry the bar. Keep `SubmissionTableSkeleton.vue` in step.
 */
const props = defineProps<{
  submissions: SubmissionListItem[];
  columns: readonly ColumnKey[];
  highlightIds: ReadonlySet<string>;
  problemLabels: Record<string, string>;
  contestPoints: Record<string, number>;
  pickedIds?: readonly string[];
  unlimitedPicks?: boolean;
  rankStart?: number;
  ownUsername?: string;
  /** `ledger`: the rows sit on the page (a rule under each); `surface`: inside a card. */
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
const isOwn = (row: SubmissionListItem) =>
  props.ownUsername !== undefined && row.user?.username === props.ownUsername;
const hasName = (row: SubmissionListItem) => isShown('user') && row.user !== null;
/** Time and memory of a finished row only (an unfinished one has nothing to say there); beside a name only the time has room. */
const costOf = (row: SubmissionListItem) =>
  isShown('cost') && isFinished(row)
    ? [
        row.time !== null ? formatCaseTime(row.time) : '',
        row.memory !== null && !hasName(row) ? formatCaseMemory(row.memory) : '',
      ].filter(Boolean)
    : [];
</script>

<template>
  <ul :aria-label="$t('submissions.listName')" class="m-0 list-none p-0">
    <li
      v-for="(row, index) in submissions"
      :key="row.id"
      :data-id="row.id"
      :data-own="isOwn(row) || undefined"
      class="flex min-h-13 cursor-pointer items-center gap-3 px-2 py-1.5 hover:bg-surface-hover"
      :class="[
        variant === 'surface' && 'first:border-t-0',
        ROW_RULE[variant ?? 'ledger'],
        { 'row-added': highlightIds.has(row.id) },
        ownUsername !== undefined && OWN_BAR.list[isOwn(row) ? 'own' : 'other'],
      ]"
      @click="openRow($event, row.id)"
      @auxclick="openRowInTab($event, row.id)"
    >
      <span
        v-if="rankStart !== undefined"
        class="w-6 shrink-0 text-right text-sm font-semibold text-muted tabular-nums"
        >{{ rankStart + index }}</span
      >
      <SubmissionPickBox
        v-if="pickedIds"
        :id="row.id"
        :order="pickOrder(row.id)"
        :picked-count="pickedIds.length"
        :unlimited="unlimitedPicks"
        @toggle="emit('togglePick', $event)"
      />
      <div v-if="isShown('verdict')" class="flex w-24 shrink-0 flex-col items-start">
        <SubmissionVerdictCell :row="row" class="[&>*]:!min-h-0" />
        <SubmissionScore :row="row" :contest-max="contestMaxOf(row)" tight />
      </div>
      <div class="flex min-w-0 flex-1 flex-col">
        <SubmissionProblemName
          v-if="isShown('problem')"
          class="text-body"
          short
          :problem="row.problem"
          :label="row.problem ? problemLabels[row.problem.code] : undefined"
        />
        <p
          class="m-0 flex min-w-0 items-center gap-1 overflow-hidden text-small leading-4 whitespace-nowrap text-muted [&>*+*]:before:mr-1 [&>*+*]:before:content-['·']"
        >
          <UserLink
            v-if="hasName(row) && row.user"
            class="min-w-0"
            :username="row.user.username"
            :rating="row.user.rating"
            :show-avatar="false"
          />
          <span
            v-for="(part, partIndex) in costOf(row)"
            :key="partIndex"
            class="shrink-0 font-mono tabular-nums"
            >{{ part }}</span
          >
          <LanguageLabel
            v-if="isShown('language') && row.language && !hasName(row)"
            class="min-w-0 shrink-100"
            :language="row.language"
            :title="row.language.name"
          />
        </p>
      </div>
      <time
        v-if="isShown('when')"
        class="shrink-0 text-right text-small whitespace-nowrap text-muted"
        :datetime="row.date"
        :title="formatDate(row.date, 'datetime', locale.locale)"
        >{{ formatAgoCompact(row.date, now, locale.locale) }}</time
      >
    </li>
  </ul>
</template>
