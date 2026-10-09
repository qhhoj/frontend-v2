<script setup lang="ts">
import { Ghost } from 'lucide-vue-next';
import { computed, useId } from 'vue';
import type { ReplayProblem } from '@/api/types/replay';
import EmptyState from '@/components/EmptyState.vue';
import { formatDuration } from '@/lib/format';
import type { RankingContext } from '@/lib/ranking-cells';
import { feedTextOf } from './replay-timeline';
import type { TimelineEntry } from './replay-timeline';

/** M2B "Vừa xảy ra": the latest events at the clock. Not a live region: it changes four times a second while playing. */
const props = defineProps<{
  entries: TimelineEntry[];
  problems: ReplayProblem[];
  context: RankingContext;
}>();
const headingId = useId();
const lines = computed(() =>
  props.entries.flatMap(({ event, identity }) => {
    const problem = props.problems[event[2]];
    if (!problem) return [];
    return [
      {
        key: `${identity.id}-${event[0]}-${event[2]}`,
        clock: formatDuration(event[0]),
        name: identity.name,
        isGhost: identity.kind === 'ghost',
        text: feedTextOf(event[3], problem, props.context),
      },
    ];
  }),
);
</script>

<template>
  <section :aria-labelledby="headingId" class="glass flex flex-col gap-3 rounded-card p-5">
    <h2 :id="headingId" class="font-display text-lg font-semibold">
      {{ $t('replay.feed.title') }}
    </h2>
    <EmptyState v-if="!lines.length" compact>{{ $t('replay.feed.empty') }}</EmptyState>
    <ol v-else class="flex flex-col gap-2.5 text-sm">
      <li
        v-for="line in lines"
        :key="line.key"
        class="flex flex-col gap-0.5 border-t border-line pt-2.5 first:border-t-0 first:pt-0"
      >
        <span class="font-mono text-xs text-muted tabular-nums">{{ line.clock }}</span>
        <span class="flex flex-wrap items-center gap-1.5" :class="line.isGhost && 'text-muted'">
          <Ghost v-if="line.isGhost" class="size-3.5 shrink-0" aria-hidden="true" />
          <span v-if="line.isGhost" class="sr-only">{{ $t('replay.table.ghost') }}</span>
          <strong class="font-semibold">{{ line.name }}</strong>
          {{ $t(line.text.key, line.text.params) }}
        </span>
      </li>
    </ol>
  </section>
</template>
