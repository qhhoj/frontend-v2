<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { shortId } from '../ui/short-id';
import VerdictBadge from '@/components/VerdictBadge.vue';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import type { PairDetailSide } from '@/api/types/similarity';
import { isDeletedSide, lineIdOf, sourceLines, verdictOfResult } from './similarity-pairs';

/** One side of the pair: its name and facts, then its code with the matched lines marked. */
const props = defineProps<{
  side: 'left' | 'right';
  source: PairDetailSide;
  /** Line number (1-based) to the index of the fragment that covers it. */
  fragmentOf: Map<number, number>;
}>();

const { t } = useI18n();
const locale = useLocaleStore();
const lines = computed(() => sourceLines(props.source.source));
const verdict = computed(() => verdictOfResult(props.source.result));
const isDeleted = computed(() => isDeletedSide(props.source));
const factsText = computed(() => {
  const parts: string[] = [];
  if (props.source.points !== null) {
    parts.push(
      t('admin.similarity.pair.pane.points', {
        points: formatNumber(props.source.points, locale.locale),
      }),
    );
  }
  if (props.source.date !== null)
    parts.push(formatDate(props.source.date, 'datetime', locale.locale));
  return parts.join(' · ');
});
/** Fragments alternate between two background tokens, so neighbours read apart without colour alone. */
const fragmentClass = (index: number) => (index % 2 === 0 ? 'bg-accent-soft' : 'bg-surface-strong');
/** A matched line takes its fragment's background and a left rule; an unmatched line has no class. */
const lineClass = (line: number): string => {
  const fragment = props.fragmentOf.get(line);
  return fragment === undefined ? '' : `${fragmentClass(fragment)} border-l-4 border-accent`;
};
</script>

<template>
  <section class="flex min-w-0 flex-col gap-3 rounded-panel border border-line p-3">
    <header class="flex flex-wrap items-center gap-2">
      <AdminUserLabel :username="source.username" :size="28" />
      <VerdictBadge v-if="verdict" :verdict="verdict" size="sm" />
      <span class="text-sm text-muted">{{ factsText }}</span>
      <RouterLink
        :to="`/submissions/${source.submissionId}`"
        class="font-mono text-xs underline min-h-11 inline-flex items-center"
      >
        {{ shortId(source.submissionId) }}
      </RouterLink>
    </header>
    <p v-if="isDeleted" class="text-sm text-muted">
      {{ $t('admin.similarity.pair.pane.deleted') }}
    </p>
    <div
      v-else
      role="region"
      tabindex="0"
      :aria-label="
        $t('admin.similarity.pair.pane.code', { side: $t(`admin.similarity.pair.pane.${side}`) })
      "
      class="max-h-[70vh] overflow-auto font-mono text-sm"
    >
      <ol class="font-mono text-sm">
        <li
          v-for="(text, index) in lines"
          :id="lineIdOf(side, index + 1)"
          :key="index"
          :data-fragment="fragmentOf.get(index + 1)"
          class="flex gap-3 whitespace-pre"
          :class="lineClass(index + 1)"
        >
          <span aria-hidden="true" class="w-10 shrink-0 text-right text-muted select-none">{{
            index + 1
          }}</span>
          <span>{{ text }}</span>
        </li>
      </ol>
    </div>
  </section>
</template>
