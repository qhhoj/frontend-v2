<script setup lang="ts">
import { Code } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { IN_PROGRESS_STATUSES } from '@/api/types/submissions';
import type { SubmissionListItem } from '@/api/types/submissions';
import Card from '@/components/ui/Card.vue';
import IconButton from '@/components/ui/IconButton.vue';
import ScrollRegion from '@/components/ScrollRegion.vue';
import LanguageLabel from '@/components/language/LanguageLabel.vue';
import UserLink from '@/components/UserLink.vue';
import { formatAgoCompact, formatDate } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { usePermissions } from '@/stores/use-permissions';
import SubmissionCompactList from './SubmissionCompactList.vue';
import SubmissionPickBox from './SubmissionPickBox.vue';
import SubmissionProblemName from './SubmissionProblemName.vue';
import SubmissionScore from './SubmissionScore.vue';
import SubmissionVerdictCell from './SubmissionVerdictCell.vue';
import {
  COMPACT_BELOW_PX,
  FULL_TABLE_CLASS,
  NUMBER_CELLS,
  OWN_BAR,
  ROW_RULE,
  TABLE_CARD_CLASS,
  bodyCellClasses,
  cellsOf,
  fullCellClass,
  headerCellClasses,
  headerRowClasses,
} from './submission-table-cells';
import type { CellKind, ColumnKey, TableVariant } from './submission-table-cells';
import { isFinished } from './submission-row';
import { useRowOpen } from './row-open';
import { useIsNarrow } from './use-card-compact';
import { NO_VALUE, formatCaseMemory, formatCaseTime } from '@/lib/format';

/**
 * The one submission table (site list, problem tabs, contest, organization, best submissions): one 44 px line per row,
 * the whole row opens the submission. Colour sits on the lamp, the verdict code and the score only; the viewer's own
 * rows carry a bar on the left. A row still being judged says so in words across the verdict and score cells. The
 * last cell is a quiet icon link to the row's source, on the rows whose source this viewer may surely read (their own;
 * every row for `judge.view_all_submission`): the list rows carry no access flag, so other rows have none. A frameless
 * ledger by default; `variant="surface"` is for a table inside a card of its own. Keep `SubmissionTableSkeleton.vue` in
 * step: same frame, header cells and row classes (it has no source cell: it cannot know the rows).
 */
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
    /** The viewer's username: their rows carry the bar. Left out where every row is theirs. */
    ownUsername?: string;
    variant?: TableVariant;
  }>(),
  {
    variant: 'ledger',
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
const bodyCell = computed(() => bodyCellClasses(props.variant));
const headerCell = computed(() => headerCellClasses(props.variant));
const locale = useLocaleStore();
const emit = defineEmits<{ togglePick: [id: string] }>();
const { openRow, openRowInTab } = useRowOpen();
const frame = ref<HTMLElement | { $el: HTMLElement } | null>(null);
const isCompact = useIsNarrow(
  () => (frame.value && '$el' in frame.value ? frame.value.$el : frame.value),
  COMPACT_BELOW_PX,
);
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
const isInProgress = (row: SubmissionListItem) => IN_PROGRESS_STATUSES.includes(row.status);
const session = useSessionStore();
const { can } = usePermissions();
const VIEW_ALL_PERMISSION = 'judge.view_all_submission';
const canReadSource = (row: SubmissionListItem) =>
  can(VIEW_ALL_PERMISSION) || (session.user !== null && row.user?.id === session.user.id);
const hasSourceCell = computed(() => props.submissions.some(canReadSource));
const contestMaxOf = (row: SubmissionListItem) =>
  row.problem ? props.contestPoints[row.problem.code] : undefined;
const NUMBER_ALIGN = 'text-right font-mono text-sm tabular-nums';
const timeText = (row: SubmissionListItem) =>
  isFinished(row) && row.time !== null ? formatCaseTime(row.time) : NO_VALUE;
const memoryText = (row: SubmissionListItem) =>
  isFinished(row) && row.memory !== null ? formatCaseMemory(row.memory) : NO_VALUE;
</script>

<template>
  <component
    :is="variant === 'surface' ? Card : 'div'"
    ref="frame"
    v-bind="variant === 'surface' ? { as: 'div' } : {}"
    data-testid="submission-table-card"
    :class="TABLE_CARD_CLASS"
  >
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
      :variant="variant"
      @toggle-pick="emit('togglePick', $event)"
    />
    <ScrollRegion v-else :label="$t('submissions.scrollRegion')">
      <table :class="FULL_TABLE_CLASS">
        <caption class="sr-only">
          {{
            $t('submissions.listName')
          }}
        </caption>
        <thead>
          <tr :class="headerRowClasses(variant)">
            <th v-if="isPicking" scope="col" :class="[headerCell, classOf('pick')]">
              {{ $t('sourceDiff.select.column') }}
            </th>
            <th v-if="rankStart !== undefined" scope="col" :class="[headerCell, 'w-14 text-right']">
              {{ $t('submissions.columns.rank') }}
            </th>
            <th
              v-for="kind in cells"
              :key="kind"
              scope="col"
              :class="[headerCell, classOf(kind), { 'text-right': NUMBER_CELLS.has(kind) }]"
            >
              {{ $t(`submissions.columns.${kind}`) }}
            </th>
            <th v-if="hasSourceCell" scope="col" :class="[headerCell, classOf('source')]">
              <span class="sr-only">{{ $t('submissions.viewSource') }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in submissions"
            :key="row.id"
            :data-id="row.id"
            class="cursor-pointer hover:bg-surface-hover"
            :class="[
              ROW_RULE[variant],
              { 'row-added': highlightIds.has(row.id) },
              ownUsername !== undefined && OWN_BAR.table[isOwn(row) ? 'own' : 'other'],
            ]"
            :data-own="isOwn(row) || undefined"
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
              <td
                v-if="kind === 'verdict'"
                :colspan="isInProgress(row) ? 2 : undefined"
                :class="[bodyCell, classOf(kind)]"
              >
                <span class="flex items-center gap-2">
                  <SubmissionVerdictCell :row="row" />
                  <SubmissionScore v-if="isInProgress(row)" :row="row" />
                </span>
              </td>
              <!-- A row in progress has no score yet: its verdict cell spans this one. -->
              <template v-else-if="kind === 'score' && isInProgress(row)" />
              <td v-else-if="kind === 'score'" :class="[bodyCell, classOf(kind), 'text-right']">
                <SubmissionScore :row="row" :contest-max="contestMaxOf(row)" />
              </td>
              <td v-else-if="kind === 'problem'" :class="[bodyCell, classOf(kind)]">
                <SubmissionProblemName
                  :problem="row.problem"
                  :label="row.problem ? problemLabels[row.problem.code] : undefined"
                  show-code
                />
              </td>
              <td v-else-if="kind === 'user'" :class="[bodyCell, classOf(kind)]">
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
                :class="[bodyCell, classOf(kind), 'text-small text-muted']"
                :title="row.language?.name"
              >
                <LanguageLabel v-if="row.language" :language="row.language" />
                <template v-else>{{ NO_VALUE }}</template>
              </td>
              <td v-else :class="[bodyCell, classOf(kind), 'text-right text-small text-muted']">
                <time
                  :datetime="row.date"
                  :title="formatDate(row.date, 'datetime', locale.locale)"
                  >{{ formatAgoCompact(row.date, now, locale.locale) }}</time
                >
              </td>
            </template>
            <td v-if="hasSourceCell" :class="[bodyCell, classOf('source')]">
              <IconButton
                v-if="canReadSource(row)"
                size="sm"
                data-testid="row-source"
                :to="{ name: 'submission', params: { id: row.id }, hash: '#source' }"
                :label="$t('submissions.viewSource')"
              >
                <Code aria-hidden="true" />
              </IconButton>
            </td>
          </tr>
        </tbody>
      </table>
    </ScrollRegion>
  </component>
</template>
