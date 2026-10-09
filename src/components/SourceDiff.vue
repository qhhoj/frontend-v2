<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import GlassCard from '@/components/GlassCard.vue';
import SummaryPill from '@/components/SourceDiffSummaryPill.vue';
import { diffSummary, foldSameRuns, wordSegments } from '@/lib/line-diff';
import type { DiffRow, Segment } from '@/lib/line-diff';

/** Keep `SourceDiffSkeleton.vue` in step: same card, summary row and line font. Colours: only the verdict pairs themes.spec.ts checks. */
const props = defineProps<{ rows: DiffRow[] }>();
type Side = 'left' | 'right';

const blocks = computed(() => foldSameRuns(props.rows));
const summary = computed(() => diffSummary(props.rows));
/** Indexes of the folded blocks the viewer opened; a new diff starts folded again. */
const openedFolds = ref(new Set<number>());
watch(
  () => props.rows,
  () => (openedFolds.value = new Set()),
);
const region = ref<HTMLElement | null>(null);
const isShown = (index: number) =>
  blocks.value[index]?.kind === 'open' || openedFolds.value.has(index);
function openFold(index: number) {
  openedFolds.value = new Set([...openedFolds.value, index]);
  // The button is gone: keep the keyboard in the code region.
  region.value?.focus();
}

const isChangedOn = (row: DiffRow, side: Side) => row.kind !== 'same' && row[side] !== null;
const TONE = {
  left: 'bg-verdict-wa-bg text-verdict-wa',
  right: 'bg-verdict-ac-bg text-verdict-ac',
};
const WORD = {
  left: 'rounded-cell bg-verdict-wa-bg font-bold text-verdict-wa',
  right: 'rounded-cell bg-verdict-ac-bg font-bold text-verdict-ac',
};
const toneOf = (row: DiffRow, side: Side) => (isChangedOn(row, side) ? TONE[side] : 'text-muted');
const signOf = (row: DiffRow, side: Side) =>
  isChangedOn(row, side) ? (side === 'left' ? '−' : '+') : '';
const signLabelKey = (row: DiffRow, side: Side) =>
  isChangedOn(row, side)
    ? side === 'left'
      ? 'sourceDiff.sign.removed'
      : 'sourceDiff.sign.added'
    : null;
function segmentsOf(row: DiffRow, side: Side): Segment[] {
  const line = row[side];
  if (line === null) return [];
  if (row.kind === 'changed' && row.left && row.right)
    return wordSegments(row.left.text, row.right.text)[side];
  return [{ text: line.text, isChanged: false }];
}
const rowKey = (row: DiffRow) => `${row.left?.number ?? '-'}:${row.right?.number ?? '-'}`;
const SIDES: readonly Side[] = ['left', 'right'];

/** Phone layout (board M6CPhone): one column, so a changed row becomes a removed line then an added line. */
interface PhoneLine {
  key: string;
  side: Side;
  kind: 'same' | 'removed' | 'added';
  oldNumber: number | null;
  newNumber: number | null;
  segments: Segment[];
  isMoved: boolean;
  isWhitespaceOnly: boolean;
}
const phoneNumbersOf = (row: DiffRow, kind: PhoneLine['kind']) => ({
  oldNumber: kind === 'added' ? null : (row.left?.number ?? null),
  newNumber: kind === 'removed' ? null : (row.right?.number ?? null),
});
function phoneLine(row: DiffRow, side: Side, kind: PhoneLine['kind']): PhoneLine {
  return {
    ...phoneNumbersOf(row, kind),
    key: `${rowKey(row)}:${kind}`,
    side,
    kind,
    segments: segmentsOf(row, side),
    isMoved: kind !== 'same' && row.isMoved,
    isWhitespaceOnly: kind === 'added' && row.isWhitespaceOnly,
  };
}
function phoneLinesOf(row: DiffRow): PhoneLine[] {
  if (row.kind === 'same') return [phoneLine(row, 'left', 'same')];
  const lines: PhoneLine[] = [];
  if (row.left) lines.push(phoneLine(row, 'left', 'removed'));
  if (row.right) lines.push(phoneLine(row, 'right', 'added'));
  return lines;
}
const phoneToneOf = (line: PhoneLine) => (line.kind === 'same' ? 'text-muted' : TONE[line.side]);
</script>

<template>
  <GlassCard as="div" data-testid="source-diff" class="overflow-hidden rounded-panel">
    <ul data-testid="diff-summary" class="flex flex-wrap gap-2 px-5 py-4 text-sm sm:px-6">
      <li class="rounded-pill bg-verdict-ac-bg px-3 py-1 font-semibold text-verdict-ac">
        <SummaryPill
          :full="$t('sourceDiff.summary.added', { count: summary.added })"
          :short="$t('sourceDiff.summary.addedShort', { count: summary.added })"
        />
      </li>
      <li class="rounded-pill bg-verdict-wa-bg px-3 py-1 font-semibold text-verdict-wa">
        <SummaryPill
          :full="$t('sourceDiff.summary.removed', { count: summary.removed })"
          :short="$t('sourceDiff.summary.removedShort', { count: summary.removed })"
        />
      </li>
      <li class="rounded-pill bg-surface-strong px-3 py-1 text-muted">
        <SummaryPill
          :full="$t('sourceDiff.summary.same', { count: summary.same })"
          :short="$t('sourceDiff.summary.sameShort', { count: summary.same })"
        />
      </li>
    </ul>
    <div
      ref="region"
      tabindex="0"
      role="region"
      :aria-label="$t('sourceDiff.regionLabel')"
      class="overflow-x-auto bg-surface-strong focus-visible:-outline-offset-2"
    >
      <table
        data-testid="diff-table-wide"
        class="hidden w-full min-w-[720px] table-fixed border-collapse font-mono text-[13px] leading-relaxed sm:table"
      >
        <caption class="sr-only">
          {{
            $t('sourceDiff.caption')
          }}
        </caption>
        <colgroup>
          <col class="w-12" />
          <col class="w-7" />
          <col />
          <col class="w-12" />
          <col class="w-7" />
          <col />
        </colgroup>
        <thead class="sr-only">
          <tr>
            <th scope="col">{{ $t('sourceDiff.columns.leftNumber') }}</th>
            <th scope="col">{{ $t('sourceDiff.columns.leftSign') }}</th>
            <th scope="col">{{ $t('sourceDiff.columns.leftCode') }}</th>
            <th scope="col">{{ $t('sourceDiff.columns.rightNumber') }}</th>
            <th scope="col">{{ $t('sourceDiff.columns.rightSign') }}</th>
            <th scope="col">{{ $t('sourceDiff.columns.rightCode') }}</th>
          </tr>
        </thead>
        <tbody v-for="(block, index) in blocks" :key="index">
          <tr v-if="!isShown(index)">
            <td colspan="6" class="border-y border-line p-0">
              <button
                type="button"
                data-testid="diff-fold"
                class="min-h-11 w-full px-4 text-left font-body text-sm text-muted hover:bg-surface-hover hover:text-content"
                @click="openFold(index)"
              >
                {{ $t('sourceDiff.foldShow', { count: block.rows.length }, block.rows.length) }}
              </button>
            </td>
          </tr>
          <template v-else>
            <tr
              v-for="row in block.rows"
              :key="rowKey(row)"
              :data-kind="row.kind"
              :data-moved="row.isMoved || undefined"
            >
              <template v-for="side in SIDES" :key="side">
                <td
                  :data-cell="`${side}-number`"
                  class="px-2 text-right align-top select-none"
                  :class="toneOf(row, side)"
                >
                  {{ row[side]?.number ?? '' }}
                </td>
                <td class="text-center align-top select-none" :class="toneOf(row, side)">
                  <span aria-hidden="true">{{ signOf(row, side) }}</span>
                  <span v-if="signLabelKey(row, side)" class="sr-only">{{
                    $t(signLabelKey(row, side)!)
                  }}</span>
                </td>
                <td
                  class="px-2 align-top break-all whitespace-pre-wrap text-content"
                  :class="side === 'right' ? 'border-l border-line' : ''"
                >
                  <span
                    v-for="(part, partIndex) in segmentsOf(row, side)"
                    :key="partIndex"
                    :data-word="part.isChanged ? 'changed' : undefined"
                    :class="part.isChanged ? WORD[side] : ''"
                    >{{ part.text }}</span
                  ><span
                    v-if="row.isMoved && row[side]"
                    class="ml-2 rounded-pill border border-line px-2 font-body text-xs text-muted"
                    >{{ $t('sourceDiff.moved') }}</span
                  ><span
                    v-if="row.isWhitespaceOnly && side === 'right'"
                    class="ml-2 rounded-pill border border-line px-2 font-body text-xs text-muted"
                    >{{ $t('sourceDiff.whitespaceOnly') }}</span
                  >
                </td>
              </template>
            </tr>
          </template>
        </tbody>
      </table>
      <table
        data-testid="diff-table-narrow"
        class="w-full table-fixed border-collapse font-mono text-[13px] leading-relaxed sm:hidden"
      >
        <caption class="sr-only">
          {{
            $t('sourceDiff.caption')
          }}
        </caption>
        <colgroup>
          <col class="w-9" />
          <col class="w-9" />
          <col class="w-6" />
          <col />
        </colgroup>
        <thead class="sr-only">
          <tr>
            <th scope="col">{{ $t('sourceDiff.columns.oldNumber') }}</th>
            <th scope="col">{{ $t('sourceDiff.columns.newNumber') }}</th>
            <th scope="col">{{ $t('sourceDiff.columns.sign') }}</th>
            <th scope="col">{{ $t('sourceDiff.columns.code') }}</th>
          </tr>
        </thead>
        <tbody v-for="(block, index) in blocks" :key="index">
          <tr v-if="!isShown(index)">
            <td colspan="4" class="border-y border-line p-0">
              <button
                type="button"
                data-testid="diff-fold"
                class="min-h-11 w-full px-3 text-left font-body text-sm text-muted hover:bg-surface-hover hover:text-content"
                @click="openFold(index)"
              >
                {{ $t('sourceDiff.foldShow', { count: block.rows.length }, block.rows.length) }}
              </button>
            </td>
          </tr>
          <template v-else>
            <tr
              v-for="line in block.rows.flatMap(phoneLinesOf)"
              :key="line.key"
              :data-kind="line.kind"
              :data-moved="line.isMoved || undefined"
            >
              <td class="px-1 text-right align-top select-none" :class="phoneToneOf(line)">
                {{ line.oldNumber ?? '' }}
              </td>
              <td class="px-1 text-right align-top select-none" :class="phoneToneOf(line)">
                {{ line.newNumber ?? '' }}
              </td>
              <td class="text-center align-top select-none" :class="phoneToneOf(line)">
                <template v-if="line.kind !== 'same'">
                  <span aria-hidden="true">{{ line.kind === 'removed' ? '−' : '+' }}</span>
                  <span class="sr-only">{{ $t(`sourceDiff.sign.${line.kind}`) }}</span>
                </template>
              </td>
              <td class="px-2 align-top break-all whitespace-pre-wrap text-content">
                <span
                  v-for="(part, partIndex) in line.segments"
                  :key="partIndex"
                  :data-word="part.isChanged ? 'changed' : undefined"
                  :class="part.isChanged ? WORD[line.side] : ''"
                  >{{ part.text }}</span
                ><span
                  v-if="line.isMoved"
                  class="ml-2 rounded-pill border border-line px-2 font-body text-xs text-muted"
                  >{{ $t('sourceDiff.moved') }}</span
                ><span
                  v-if="line.isWhitespaceOnly"
                  class="ml-2 rounded-pill border border-line px-2 font-body text-xs text-muted"
                  >{{ $t('sourceDiff.whitespaceOnly') }}</span
                >
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </GlassCard>
</template>
