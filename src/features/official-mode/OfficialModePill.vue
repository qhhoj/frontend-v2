<script setup lang="ts">
import { Lock } from 'lucide-vue-next';
import { computed } from 'vue';
import { useNow } from '@/lib/use-now';
import { useOfficialMode } from './official-mode.queries';
import { remainingText } from './official-until';

/** "Thi chính thức · còn 1:12:40" beside the logo while the mode is on; the countdown needs `officialModeEndsAt`, else just the label. */
const mode = useOfficialMode();
const now = useNow();
const remaining = computed(() =>
  mode.endsAt.value === null ? '' : remainingText(mode.endsAt.value, now.value),
);
</script>

<template>
  <span
    v-if="mode.isActive.value"
    data-testid="official-pill"
    class="inline-flex min-h-8 shrink-0 items-center whitespace-nowrap gap-1.5 rounded-pill bg-verdict-tle-bg px-3 text-sm font-semibold text-verdict-tle"
  >
    <Lock aria-hidden="true" class="size-4" />
    {{ $t('officialMode.pill') }}
    <template v-if="remaining">· {{ $t('officialMode.remaining', { time: remaining }) }}</template>
  </span>
</template>
