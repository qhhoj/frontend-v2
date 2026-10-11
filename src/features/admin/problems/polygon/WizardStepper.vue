<script setup lang="ts">
import { Check } from 'lucide-vue-next';
import { WIZARD_STEPS, stepStatusOf } from './polygon-wizard';
import type { WizardStep } from './polygon-wizard';

/** The three steps as a strip; the current one is `aria-current`, the earlier ones carry a check. */
defineProps<{ current: WizardStep }>();
const MARK_CLASS = {
  done: 'bg-verdict-ac-bg text-verdict-ac',
  current: 'bg-accent text-on-accent',
  upcoming: 'bg-surface-strong text-muted',
} as const;
</script>

<template>
  <ol :aria-label="$t('admin.polygonLink.wizard.stepsLabel')" class="flex flex-wrap gap-2">
    <li
      v-for="(step, index) in WIZARD_STEPS"
      :key="step"
      :aria-current="stepStatusOf(step, current) === 'current' ? 'step' : undefined"
      class="flex min-h-9 items-center gap-2 rounded-pill border px-3 text-sm font-semibold pointer-coarse:min-h-11"
      :class="
        stepStatusOf(step, current) === 'current'
          ? 'border-accent text-accent-text'
          : 'border-line text-muted'
      "
    >
      <span
        aria-hidden="true"
        class="inline-flex size-6 items-center justify-center rounded-full text-xs font-bold"
        :class="MARK_CLASS[stepStatusOf(step, current)]"
      >
        <Check v-if="stepStatusOf(step, current) === 'done'" class="size-3.5" />
        <span v-else>{{ index + 1 }}</span>
      </span>
      {{ $t(`admin.polygonLink.wizard.steps.${step}`) }}
    </li>
  </ol>
</template>
