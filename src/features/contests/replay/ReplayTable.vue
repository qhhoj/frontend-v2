<script setup lang="ts">
import { Ghost } from 'lucide-vue-next';
import { computed, ref, toRef, TransitionGroup } from 'vue';
import UserName from '@/components/UserName.vue';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { isPenaltyFormat, showsCumtime } from '@/lib/ranking-cells';
import type { RankingContext } from '@/lib/ranking-cells';
import { useMotionAllowed } from '@/lib/use-motion-allowed';
import RankingCell from '../RankingCell.vue';
import type { BoardRow, ReplayBoard } from './replay-board';
import { useReplayRowCells } from './use-replay-row-cells';

/**
 * The board at one second. Rows move with a FLIP transition (`TransitionGroup` move class) only while motion is allowed and
 * the board is small enough: FLIP measures every row on every tick, so bigger boards and reduced motion or low-power get a
 * plain `tbody`. There a row is redrawn only when its rank, its cells (`useReplayRowCells`) or the viewer mark change
 * (`v-memo`; `TransitionGroup` re-creates its children, so small animated boards redraw rows but keep their cell views).
 * Ghosts are muted by colour, an icon and a chip (never opacity); unranked ghosts show "—".
 */
const props = defineProps<{
  board: ReplayBoard;
  context: RankingContext;
  viewerId: string | null;
  label: string;
}>();
const isMotionAllowed = useMotionAllowed();
const MOVE_CLASS = 'transition-transform duration-(--qh-duration) ease-out';
/** Above this many rows the rows jump instead of sliding (FLIP reads every row's box on every tick). */
const FLIP_MAX_ROWS = 100;
const isAnimated = computed(
  () => isMotionAllowed.value && props.board.rows.length <= FLIP_MAX_ROWS,
);
const rowCells = useReplayRowCells(toRef(props, 'board'), toRef(props, 'context'));
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
      <component
        :is="isAnimated ? TransitionGroup : 'tbody'"
        v-bind="isAnimated ? { tag: 'tbody', moveClass: MOVE_CLASS } : {}"
        :data-motion="isAnimated ? 'on' : 'off'"
        class="font-mono text-sm tabular-nums"
      >
        <tr
          v-for="row in board.rows"
          :key="row.id"
          v-memo="[row.rank, rowCells.get(row.id), isViewerRow(row)]"
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
            {{ row.isUnranked ? '—' : rowCells.get(row.id)!.score }}
            <small
              v-if="hasCombinedScore && !row.isUnranked"
              class="block text-[11px] font-medium text-muted"
              >{{ rowCells.get(row.id)!.cumtime }}</small
            >
          </td>
          <td v-if="hasTimeColumn">
            {{ row.isUnranked ? '—' : rowCells.get(row.id)!.cumtime }}
          </td>
          <RankingCell
            v-for="cell in rowCells.get(row.id)!.cells"
            :key="cell.problemId"
            :view="cell.view"
          />
        </tr>
      </component>
    </table>
  </div>
</template>
