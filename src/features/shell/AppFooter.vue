<script setup lang="ts">
import { computed } from 'vue';
import { useLowPowerStore } from '@/theme/low-power.store';

/** Board M10C: the footer always offers a way to the low-power switch, with the state this device is in. */
const lowPower = useLowPowerStore();
const stateKey = computed(() => {
  if (lowPower.preference !== 'auto') return `lowPower.footerState.${lowPower.preference}`;
  return lowPower.isOn ? 'lowPower.footerState.autoOn' : 'lowPower.footerState.autoOff';
});
</script>

<template>
  <footer
    data-testid="app-footer"
    class="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 px-4 pt-2 pb-[calc(max(1.5rem,env(safe-area-inset-bottom))+var(--dock-height,0px))] text-[13px] text-muted sm:px-8"
  >
    <span>© QHHOJ</span>
    <span>
      {{ $t('lowPower.footer', { state: $t(stateKey) }) }} ·
      <RouterLink
        :to="{ name: 'settings-appearance', hash: '#low-power' }"
        data-testid="low-power-footer"
        :aria-label="$t('lowPower.footerChangeLabel')"
        class="inline-flex min-h-11 items-center text-accent-text underline"
        >{{ $t('lowPower.footerChange') }}</RouterLink
      >
    </span>
  </footer>
</template>
