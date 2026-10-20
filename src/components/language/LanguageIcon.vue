<script setup lang="ts">
import { computed } from 'vue';
import { languageIconOf } from './language-icons';
import type { LanguageIconSize } from './language-icons';

/**
 * A language's mark in the text colour (a mask filled with `currentColor`): 16 px inline (`sm`), or a 32 px tile (`md`).
 * Decorative beside the language name; give `label` only where the icon stands alone.
 */
const props = withDefaults(
  defineProps<{ languageKey: string | null; size?: LanguageIconSize; label?: string }>(),
  { size: 'sm', label: undefined },
);
const icon = computed(() => languageIconOf(props.languageKey, props.size));
const isTile = computed(() => props.size === 'md');
const maskStyle = computed(() =>
  icon.value.kind === 'logo'
    ? { maskImage: `url(${icon.value.url})`, WebkitMaskImage: `url(${icon.value.url})` }
    : undefined,
);
</script>

<template>
  <span
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :title="label"
    :aria-hidden="label ? undefined : 'true'"
    data-testid="language-icon"
    class="inline-flex shrink-0 items-center justify-center"
    :class="isTile ? 'size-8 rounded-cell bg-surface-strong text-content' : 'size-4'"
  >
    <span
      v-if="icon.kind === 'logo'"
      class="language-mask block bg-current"
      :class="isTile ? 'size-5' : 'size-4'"
      :style="maskStyle"
    />
    <component
      :is="icon.icon"
      v-else-if="icon.kind === 'lucide'"
      :class="isTile ? 'size-5' : 'size-4'"
    />
    <span v-else class="font-mono text-tiny font-bold">{{ icon.text }}</span>
  </span>
</template>

<style scoped>
.language-mask {
  mask-position: center;
  mask-repeat: no-repeat;
  mask-size: contain;
  -webkit-mask-position: center;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: contain;
}

/* Forced colours drop backgrounds, which would erase the mask's fill: paint it in the system text colour instead. */
@media (forced-colors: active) {
  .language-mask {
    forced-color-adjust: none;
    background-color: CanvasText;
  }
}
</style>
