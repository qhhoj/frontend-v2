<script setup lang="ts">
import BitMascot from '@/components/BitMascot.vue';
import InlineBit from '@/components/InlineBit.vue';
import StateBit from '@/components/StateBit.vue';
import type { BitKind } from '@/mascot/bit-frames';
import type { BitMood } from '@/mascot/bit-moods';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';

/**
 * The one "nothing here" block of every list: Bit asleep in a nightcap above the message (default slot), then its next
 * step (`action` slot).
 * `compact` is the small one inside a card: the same 48 px Bit as InlineBit, decorative because the message beside it already
 * says the list is empty. `kind` picks that small Bit (asleep by default; `security` for the security page's key list). The full
 * block carries a label since it stands alone, and always sleeps.
 * `inline` is the ledger's: no box, left-aligned, one row under a section title. A 24 px Bit, the fact (default slot) and,
 * after a "·", the next fact (`next` slot, e.g. "Kỳ thi tiếp theo: 21/11"); the `action` slot closes the row.
 */
withDefaults(defineProps<{ compact?: boolean; inline?: boolean; kind?: BitMood | BitKind }>(), {
  compact: false,
  inline: false,
  kind: 'asleep',
});
</script>

<template>
  <div
    v-if="inline"
    data-testid="empty-state-inline"
    class="flex min-h-(--qh-row) flex-wrap items-center gap-x-2 text-meta text-muted"
  >
    <StateBit :variant="kind" size="tiny" />
    <p class="min-w-0 flex-1 basis-48">
      <slot />
      <template v-if="$slots.next"
        ><span aria-hidden="true"> · </span><slot name="next"
      /></template>
    </p>
    <div v-if="$slots.action" class="ml-auto shrink-0"><slot name="action" /></div>
  </div>
  <div
    v-else
    class="flex items-center gap-3 text-muted"
    :class="
      compact ? 'min-h-(--qh-row) justify-center px-4' : 'flex-col gap-2 px-6 py-8 text-center'
    "
  >
    <InlineBit v-if="compact" :kind="kind" />
    <BitMascot
      v-else
      :look="PLACEMENT_LOOKS.emptyList"
      :label="$t('bit.asleep')"
      closed-eyes
      class="[--bit-px:4px] sm:[--bit-px:5px]"
    />
    <p><slot /></p>
    <div v-if="$slots.action" :class="!compact && 'mt-2'"><slot name="action" /></div>
  </div>
</template>
