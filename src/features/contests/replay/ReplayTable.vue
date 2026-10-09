<script setup lang="ts">
import { Ghost } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import UserName from '@/components/UserName.vue';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { formatNumber } from '@/lib/format';
import {
  formatCumtime,
  isPenaltyFormat,
  rankingCell,
  showsCumtime,
  solvedCount,
} from '@/lib/ranking-cells';
import type { RankingContext } from '@/lib/ranking-cells';
import { useMotionAllowed } from '@/lib/use-motion-allowed';
import RankingCell from '../RankingCell.vue';
import type { BoardRow, ReplayBoard } from './replay-board';

/**
 * The board at one second. Rows move with a FLIP transition (`TransitionGroup` move class) only while motion is allowed;
 * ghosts are muted by colour, an icon and a chip (never opacity); unranked ghosts show "—".
 */
const props = defineProps<{
  board: ReplayBoard;
  context: RankingContext;
  viewerId: string | null;
  label: string;
}>();
const isMotionAllowed = useMotionAllowed();
const MOVE_CLASS = 'transition-transform duration-(--qh-duration) ease-out';
const root = ref<HTMLElement | null>(null);
const penalty = computed(() => isPenaltyFormat(props.context.formatName));
const hasCombinedScore = computed(
  () => !penalty.value && props.context.showsTime && showsCumtime(props.context.formatName),
);
const hasTimeColumn = computed(() => penalty.value && showsCumtime(props.context.formatName));
const scoreHeaderKey = computed(() => {
  if (penalty.value) return 'ranking.columns.solved';
  return hasCombinedScore.value ? 'ranking.columns.scoreTime' : 'ranking.columns.score';
});

const cellsOf = (row: BoardRow) =>
  props.board.problems.map((problem) => ({
    problemId: problem.problemId,
    view: rankingCell(row.cells[problem.problemId], problem, row.id, props.context),
  }));
const scoreOf = (row: BoardRow) =>
  penalty.value
    ? solvedCount(
        { cells: row.cells, participationId: row.id },
        props.board.problems,
        props.context,
      )
    : formatNumber(row.score, props.context.locale, props.context.pointsPrecision);
const isViewerRow = (row: BoardRow) =>
  row.kind !== 'ghost' && row.userId !== null && row.userId === props.viewerId;

/** Focuses a row's name cell ("Về hàng của tôi"); false when the row is not on this board. */
function focusRow(rowId: string): boolean {
  const rows = [...(root.value?.querySelectorAll<HTMLElement>('tr[data-row-id]') ?? [])];
  const header = rows.find((row) => row.dataset.rowId === rowId)?.querySelector('th');
  if (!header) return false;
  header.focus();
  header.scrollIntoView?.({ block: 'center', behavior: isMotionAllowed.value ? 'smooth' : 'auto' });
  return true;
}
defineExpose({ focusRow });
</script>

<template>
  <div
    ref="root"
    tabindex="0"
    role="region"
    :aria-label="label"
    class="overflow-x-auto focus-visible:-outline-offset-2"
  >
    <table class="w-full min-w-[640px] border-collapse">
      <caption class="sr-only">
        {{
          label
        }}
      </caption>
      <thead>
        <tr class="text-center text-[13px] text-muted">
          <th scope="col" class="px-4 py-3.5 text-left font-medium">
            {{ $t('ranking.columns.rank') }}
          </th>
          <th scope="col" class="px-2.5 py-3.5 text-left font-medium">
            {{ $t('ranking.columns.user') }}
          </th>
          <th scope="col" class="px-2.5 py-3.5 font-medium">{{ $t(scoreHeaderKey) }}</th>
          <th v-if="hasTimeColumn" scope="col" class="px-2.5 py-3.5 font-medium">
            {{ $t('ranking.columns.penalty') }}
          </th>
          <th
            v-for="problem in board.problems"
            :key="problem.problemId"
            scope="col"
            class="px-1.5 py-3.5 font-bold text-content"
          >
            <abbr :title="problem.code" class="no-underline">{{ problem.label }}</abbr>
          </th>
        </tr>
      </thead>
      <TransitionGroup
        tag="tbody"
        :move-class="isMotionAllowed ? MOVE_CLASS : 'replay-row-still'"
        :data-motion="isMotionAllowed ? 'on' : 'off'"
        class="font-mono text-sm tabular-nums"
      >
        <tr
          v-for="row in board.rows"
          :key="row.id"
          :data-row-id="row.id"
          :data-kind="row.kind"
          class="border-t border-line text-center"
          :class="{ 'bg-surface-hover': isViewerRow(row) }"
        >
          <td class="px-4 py-2.5 text-left">{{ row.rank ?? '—' }}</td>
          <th scope="row" tabindex="-1" class="px-2.5 py-2.5 text-left font-body">
            <span
              v-if="row.kind === 'ghost'"
              class="inline-flex flex-wrap items-center gap-2 align-middle text-muted"
            >
              <Ghost class="size-4 shrink-0" aria-hidden="true" />
              <span>{{ row.name }}</span>
              <small v-if="row.caption" class="text-xs">{{ row.caption }}</small>
              <span class="rounded-pill bg-surface-strong px-2 py-0.5 text-[11px]">{{
                row.isUnranked ? $t('replay.table.unranked') : $t('replay.table.ghost')
              }}</span>
            </span>
            <span v-else class="inline-flex flex-wrap items-center gap-2 align-middle">
              <UserAvatar :username="row.name" :size="24" />
              <UserName :username="row.name" />
              <span v-if="row.kind === 'virtual'" class="text-muted">{{
                $t('replay.table.virtual')
              }}</span>
              <span
                v-if="isViewerRow(row)"
                class="rounded-pill bg-accent-soft px-2 py-0.5 text-[11px] text-accent-soft-text"
                >{{ $t('common.you') }}</span
              >
            </span>
          </th>
          <td class="font-bold">
            {{ row.isUnranked ? '—' : scoreOf(row) }}
            <small
              v-if="hasCombinedScore && !row.isUnranked"
              class="block text-[11px] font-medium text-muted"
              >{{ formatCumtime(context.formatName, row.cumtime) }}</small
            >
          </td>
          <td v-if="hasTimeColumn">
            {{ row.isUnranked ? '—' : formatCumtime(context.formatName, row.cumtime) }}
          </td>
          <RankingCell v-for="cell in cellsOf(row)" :key="cell.problemId" :view="cell.view" />
        </tr>
      </TransitionGroup>
    </table>
  </div>
</template>
