<script setup lang="ts">
import IconButton from '@/components/ui/IconButton.vue';
import { useLocaleStore } from '@/stores/locale.store';

const locale = useLocaleStore();
</script>

<template>
  <IconButton
    tone="secondary"
    :label="$t('locale.switchTo')"
    :lang="locale.locale === 'vi' ? 'en' : 'vi'"
    @click="locale.toggle()"
  >
    <span class="font-mono text-caption leading-4 font-semibold">{{
      locale.locale.toUpperCase()
    }}</span>
  </IconButton>
</template>
