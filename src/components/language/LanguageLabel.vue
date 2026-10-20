<script setup lang="ts">
import LanguageIcon from './LanguageIcon.vue';
import type { LanguageIconSize } from './language-icons';

/** A language as shown everywhere: its icon (decorative) then its name, which truncates while the icon stays. */
withDefaults(
  defineProps<{ language: { key: string | null; name: string }; size?: LanguageIconSize }>(),
  { size: 'sm' },
);
</script>

<template>
  <span class="inline-flex max-w-full min-w-0 items-center gap-1.5 align-bottom">
    <LanguageIcon :language-key="language.key" :size="size" />
    <span class="min-w-0 truncate">{{ language.name }}</span>
  </span>
</template>
