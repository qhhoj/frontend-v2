<script setup lang="ts">
import { useLocaleStore } from '@/stores/locale.store';

const locale = useLocaleStore();
</script>

<template>
  <button
    type="button"
    class="inline-flex size-11 items-center justify-center rounded-pill border border-line bg-surface-strong font-mono text-xs font-semibold hover:bg-surface-hover"
    :aria-label="$t('locale.switchTo')"
    :lang="locale.locale === 'vi' ? 'en' : 'vi'"
    @click="locale.toggle()"
  >
    {{ $t('locale.short') }}
  </button>
</template>
