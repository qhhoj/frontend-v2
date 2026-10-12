<!-- eslint-disable vue/multi-word-component-names -- the kit names primitives by role (docs/design-language.md). -->
<script setup lang="ts">
import Dialog from 'primevue/dialog';
import { computed } from 'vue';

export type ModalSize = 'sm' | 'md' | 'lg';

/**
 * The one dialog: PrimeVue's Dialog on the shared preset (modal, not draggable, a labelled close button, Escape closes).
 * PrimeVue traps focus while it is open and gives it back to the opener when it hides.
 * `size` picks a width (sm 480, md 640, lg 760 px, never wider than the viewport minus 2 rem) and makes the dialog fill
 * the screen below 640 px; without it the preset's 448 px applies at every width.
 * `closable` false hides the close button and ignores Escape (a busy step).
 * Slots: default (body), `header` (in place of `title`), `footer`. Other attributes (`style`, `aria-describedby`) go to the Dialog.
 */
const props = withDefaults(
  defineProps<{
    title?: string;
    size?: ModalSize;
    closable?: boolean;
  }>(),
  { title: undefined, size: undefined, closable: true },
);
const visible = defineModel<boolean>('visible', { required: true });

const WIDTHS: Record<ModalSize, string> = {
  sm: 'sm:w-[min(30rem,calc(100vw-2rem))]',
  md: 'sm:w-[min(40rem,calc(100vw-2rem))]',
  lg: 'sm:w-[min(47.5rem,calc(100vw-2rem))]',
};
const FULL_ON_PHONE =
  'max-sm:h-dvh max-sm:max-h-dvh max-sm:w-screen max-sm:rounded-none max-sm:border-0';
const sizeClass = computed(() => props.size && [WIDTHS[props.size], FULL_ON_PHONE]);
/** Merged into the preset's mask (not replacing it): no inset on a phone, so a sized dialog reaches the edges. */
const pt = computed(() => (props.size ? { mask: { class: 'max-sm:p-0' } } : undefined));
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="title"
    :draggable="false"
    :class="sizeClass"
    :pt="pt"
    :pt-options="{ mergeProps: true }"
    :closable="closable"
    :close-on-escape="closable"
    :close-button-props="{ 'aria-label': $t('common.close') }"
  >
    <template v-if="$slots.header" #header><slot name="header" /></template>
    <slot />
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </Dialog>
</template>
