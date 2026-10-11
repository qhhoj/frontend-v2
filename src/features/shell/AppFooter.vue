<script setup lang="ts">
import { computed } from 'vue';
import { useLowPowerStore } from '@/theme/low-power.store';

/** Board M10C: the footer always offers a way to the low-power switch, with the state this device is in. */
const lowPower = useLowPowerStore();
/** The served build, so staff can tell which deploy a page came from. */
const BUILD_DATE = __BUILD_DATE__;
const APP_COMMIT = __APP_COMMIT__;
/** AGPL-3.0 §13: every visitor is offered the source of the running site (frontend commit; backend and judge in the same org). */
const SOURCE_URL = 'https://github.com/qhhoj';
const commitUrl = /^[0-9a-f]{7}$/.test(APP_COMMIT)
  ? `https://github.com/qhhoj/frontend-v2/commit/${APP_COMMIT}`
  : null;
const stateKey = computed(() => {
  if (lowPower.preference !== 'auto') return `lowPower.footerState.${lowPower.preference}`;
  return lowPower.isOn ? 'lowPower.footerState.autoOn' : 'lowPower.footerState.autoOff';
});
</script>

<template>
  <footer
    data-testid="app-footer"
    class="page-gutter flex flex-wrap items-center gap-x-4 pt-2 pb-[calc(max(1.5rem,env(safe-area-inset-bottom))+var(--dock-height,0px))] text-[13px] text-muted"
  >
    <span>© QHHOJ</span>
    <span data-testid="app-version" class="font-mono text-xs" :title="$t('footer.versionTitle')"
      ><a v-if="commitUrl" :href="commitUrl" class="underline" rel="noopener">{{ APP_COMMIT }}</a
      ><template v-else>{{ APP_COMMIT }}</template> · {{ BUILD_DATE }}</span
    >
    <a
      data-testid="source-link"
      :href="SOURCE_URL"
      class="inline-flex min-h-11 items-center text-accent-text underline"
      rel="noopener"
      >{{ $t('footer.source') }}</a
    >
    <RouterLink
      :to="{ name: 'runtimes' }"
      data-testid="runtimes-footer"
      class="inline-flex min-h-11 items-center text-accent-text underline"
      >{{ $t('footer.runtimes') }}</RouterLink
    >
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
