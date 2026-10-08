<script setup lang="ts">
import BitMascot from '@/components/BitMascot.vue';
import InlineBit from '@/components/InlineBit.vue';
import type { BitKind } from '@/mascot/bit-frames';
import type { BitMood } from '@/mascot/bit-moods';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';

/**
 * The one "nothing here" block of every list: Bit asleep in a nightcap above the message (default slot).
 * `compact` is the small one inside a card: the same 48 px Bit as InlineBit, decorative because the message beside it already
 * says the list is empty. `kind` picks that small Bit (asleep by default; `security` for the security page's key list). The full
 * block carries a label since it stands alone, and always sleeps.
 */
withDefaults(defineProps<{ compact?: boolean; kind?: BitMood | BitKind }>(), {
  compact: false,
  kind: 'asleep',
});
</script>

<template>
  <div
    class="flex flex-col items-center gap-2 text-center text-muted"
    :class="compact ? 'py-3' : 'px-6 py-8'"
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
  </div>
</template>
