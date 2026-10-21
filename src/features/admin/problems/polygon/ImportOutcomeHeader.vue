<script setup lang="ts">
import { Check, CircleHelp, Clock, LoaderCircle, TriangleAlert, X } from 'lucide-vue-next';
import type { Component } from 'vue';
import type { OutcomeKind } from './import-outcome';

/** The progress step's first row (option B): the outcome's mark, its title and one line under it. */
defineProps<{ kind: OutcomeKind; title: string; line: string }>();

const RUNNING = { icon: LoaderCircle, tint: 'bg-accent-soft text-accent-text', spin: true };
const MARKS: Record<OutcomeKind, { icon: Component; tint: string; spin?: boolean }> = {
  waiting: RUNNING,
  queued: RUNNING,
  running: RUNNING,
  done: { icon: Check, tint: 'bg-verdict-ac-bg text-verdict-ac' },
  attention: { icon: TriangleAlert, tint: 'bg-warning-bg text-warning' },
  failed: { icon: X, tint: 'bg-verdict-wa-bg text-verdict-wa' },
  lost: { icon: Clock, tint: 'bg-surface-strong text-muted' },
  gone: { icon: CircleHelp, tint: 'bg-surface-strong text-muted' },
};
</script>

<template>
  <div class="flex items-start gap-3" :data-outcome="kind">
    <span
      aria-hidden="true"
      class="inline-flex size-10 shrink-0 items-center justify-center rounded-full"
      :class="MARKS[kind].tint"
    >
      <component
        :is="MARKS[kind].icon"
        class="size-5"
        :class="MARKS[kind].spin && 'motion-safe:animate-spin'"
        :stroke-width="2"
      />
    </span>
    <div class="flex min-w-0 flex-col gap-0.5">
      <h2 id="import-outcome-title" class="section-title break-words">{{ title }}</h2>
      <p v-if="line" class="text-meta break-words text-muted">{{ line }}</p>
    </div>
  </div>
</template>
