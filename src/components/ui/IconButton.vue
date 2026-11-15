<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import AppButton from './AppButton.vue';
import type { ButtonSize, ButtonTone } from './button-classes';

/**
 * A square, icon-only AppButton. `label` names it for assistive tech and as the hover tooltip; the icon goes in the slot.
 * `compact`: a 36 px button with a 40 px hit area (`::after`) for a dense bar such as the shell's top bar; on a coarse pointer it is the
 * `sm` height (44 px).
 * An icon without its own `size-*` class is drawn at the icon scale (docs/design-language.md): 16 px, 20 px in `lg`.
 */
withDefaults(
  defineProps<{
    label: string;
    tone?: ButtonTone;
    size?: ButtonSize;
    compact?: boolean;
    to?: RouteLocationRaw;
    href?: string;
    type?: 'button' | 'submit' | 'reset';
    loading?: boolean;
    disabled?: boolean;
    pressed?: boolean;
    disabledReason?: string;
  }>(),
  {
    tone: 'ghost',
    size: 'md',
    compact: false,
    to: undefined,
    href: undefined,
    type: 'button',
    pressed: undefined,
    disabledReason: undefined,
  },
);
/** The extra 2 px each side makes a 36 px button a 40 px target; neighbours 4 px apart do not overlap. */
const COMPACT_HIT_AREA = "relative after:absolute after:-inset-0.5 after:content-['']";
const ICON_SIZES: Record<ButtonSize, string> = {
  sm: '[&_svg:not([class*=size-])]:size-4',
  md: '[&_svg:not([class*=size-])]:size-4',
  lg: '[&_svg:not([class*=size-])]:size-5',
};
</script>

<template>
  <AppButton
    :tone="tone"
    :size="compact ? 'sm' : size"
    :to="to"
    :href="href"
    :type="type"
    :loading="loading"
    :disabled="disabled"
    :pressed="pressed"
    :disabled-reason="disabledReason"
    :class="[ICON_SIZES[size], compact && COMPACT_HIT_AREA]"
    :aria-label="label"
    :title="label"
    icon-only
  >
    <template #icon><slot /></template>
  </AppButton>
</template>
