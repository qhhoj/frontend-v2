<script setup lang="ts">
import { computed } from 'vue';
import ShortLinkNotFoundHint from '@/components/ShortLinkNotFoundHint.vue';
import StateBit from '@/components/StateBit.vue';
import { STATE_BITS } from '@/mascot/state-bits';
import type { StateKind } from '@/mascot/state-bits';

/** A page-sized state (empty, error, 401, 403, 404, success, sent): Bit, a heading, a line, then the actions (default slot). */
const props = withDefaults(
  defineProps<{ kind: StateKind; title: string; body?: string; isPageHeading?: boolean }>(),
  { body: undefined, isPageHeading: false },
);
const ALERT_KINDS: StateKind[] = ['error', 'signIn', 'forbidden'];
const bit = computed(() => STATE_BITS[props.kind]);
const isAlert = computed(() => ALERT_KINDS.includes(props.kind));
</script>

<template>
  <section
    data-testid="state-panel"
    :data-state="kind"
    :role="isAlert ? 'alert' : undefined"
    class="flex flex-col items-center gap-3 px-6 py-10 text-center"
  >
    <StateBit :variant="bit.variant" :label="$t(bit.labelKey)" />
    <component
      :is="isPageHeading ? 'h1' : 'h2'"
      class="font-display text-section leading-7 font-semibold text-content"
    >
      {{ title }}
    </component>
    <p v-if="body" class="max-w-md text-muted">{{ body }}</p>
    <ShortLinkNotFoundHint v-if="kind === 'notFound'" />
    <div v-if="$slots.default" class="flex flex-wrap justify-center gap-2.5"><slot /></div>
  </section>
</template>
