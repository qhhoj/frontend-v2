<script setup lang="ts">
import BitMascot from '@/components/BitMascot.vue';
import InlineBit from '@/components/InlineBit.vue';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';

/**
 * The one "nothing here" block of every list: Bit asleep in a nightcap above the message (default slot).
 * `compact` is the small one inside a card: the same 48 px asleep Bit as InlineBit, decorative because the message
 * beside it already says the list is empty; the full block carries a label since it stands alone.
 */
defineProps<{ compact?: boolean }>();
</script>

<template>
  <div
    class="flex flex-col items-center gap-2 text-center text-muted"
    :class="compact ? 'py-3' : 'px-6 py-8'"
  >
    <InlineBit v-if="compact" kind="asleep" />
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
