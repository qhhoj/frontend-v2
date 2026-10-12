<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import AppButton from './AppButton.vue';
import type { ButtonSize, ButtonTone } from './button-classes';

/** A square, icon-only AppButton. `label` names it for assistive tech and as the hover tooltip; the icon goes in the slot. */
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
    :aria-label="label"
    :title="label"
    icon-only
  >
    <template #icon><slot /></template>
  </AppButton>
</template>
