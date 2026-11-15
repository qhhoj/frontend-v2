<script setup lang="ts">
import IconButton from '@/components/ui/IconButton.vue';
import { useLocaleStore } from '@/stores/locale.store';

defineProps<{ compact?: boolean }>();
const locale = useLocaleStore();
</script>

<template>
  <IconButton
    :compact="compact"
    :label="$t('locale.switchTo')"
    :lang="locale.locale === 'vi' ? 'en' : 'vi'"
    @click="locale.toggle()"
  >
    <span class="font-mono text-caption leading-4 font-semibold">{{
      locale.locale.toUpperCase()
    }}</span>
  </IconButton>
</template>
