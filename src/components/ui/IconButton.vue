<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import AppButton from './AppButton.vue';
import type { ButtonSize, ButtonTone } from './button-classes';

/**
 * A square, icon-only AppButton. `label` names it for assistive tech and as the hover tooltip; the icon goes in the slot.
 * An icon without its own `size-*` class is drawn at the icon scale (docs/design-language.md): 16 px, 20 px in `lg`.
 */
withDefaults(
  defineProps<{
    label: string;
    tone?: ButtonTone;
    size?: ButtonSize;
    to?: RouteLocationRaw;
    href?: string;
    type?: 'button' | 'submit' | 'reset';
    loading?: boolean;
    disabled?: boolean;
  }>(),
  { tone: 'ghost', size: 'md', to: undefined, href: undefined, type: 'button' },
);
const ICON_SIZES: Record<ButtonSize, string> = {
  sm: '[&_svg:not([class*=size-])]:size-4',
  md: '[&_svg:not([class*=size-])]:size-4',
  lg: '[&_svg:not([class*=size-])]:size-5',
};
</script>

<template>
  <AppButton
    :tone="tone"
    :size="size"
    :to="to"
    :href="href"
    :type="type"
    :loading="loading"
    :disabled="disabled"
    :class="ICON_SIZES[size]"
    :aria-label="label"
    :title="label"
    icon-only
  >
    <template #icon><slot /></template>
  </AppButton>
</template>
