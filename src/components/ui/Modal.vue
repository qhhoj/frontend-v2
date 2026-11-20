<!-- eslint-disable vue/multi-word-component-names -- the kit names primitives by role (docs/design-language.md). -->
<script setup lang="ts">
import { X } from 'lucide-vue-next';
import { computed, useAttrs, useId, useTemplateRef } from 'vue';
import IconButton from './IconButton.vue';
import { useModalDialog } from './modal-dialog';

export type ModalSize = 'sm' | 'md' | 'lg';

/**
 * The one dialog: a native modal `<dialog>` (`modal-dialog.ts`: top layer, the page inert behind it, Escape closes, the page
 * does not scroll). Focus returns to the opener when it closes. On open, focus goes to the first meaningful control (an
 * `[autofocus]` element, else the first field in the body, else the first enabled footer button), never to the close button,
 * and a mouse- or touch-opened dialog shows no focus ring there (`:focus-visible` decides).
 * `size` picks a width (sm 480, md 640, lg 760 px, never wider than the viewport minus 2 rem); `lg` fills
 * the screen below 640 px, sm and md stay a centred card; without it the dialog is 448 px at every width.
 * `closable` false hides the close button and ignores Escape (a busy step). `dismissable`: a click outside closes it too.
 * Slots: default (body), `header` (in place of `title`; name the dialog with `aria-labelledby`), `footer`.
 * Other attributes (`style`, `aria-describedby`, `data-testid`) go to the `<dialog>`.
 */
defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    title?: string;
    size?: ModalSize;
    closable?: boolean;
    dismissable?: boolean;
  }>(),
  { title: undefined, size: undefined, closable: true, dismissable: false },
);
const visible = defineModel<boolean>('visible', { required: true });
const attrs = useAttrs();
const titleId = useId();

const WIDTHS: Record<ModalSize, string> = {
  sm: 'sm:w-[min(30rem,calc(100vw-2rem))]',
  md: 'sm:w-[min(40rem,calc(100vw-2rem))]',
  lg: 'sm:w-[min(47.5rem,calc(100vw-2rem))]',
};
/** Only the widest size is full screen on a phone; sm and md stay a centred card with 1 rem margins. */
const FULL_ON_PHONE =
  'max-sm:h-dvh max-sm:max-h-dvh max-sm:w-screen max-sm:max-w-none max-sm:rounded-none max-sm:border-0';
const sizeClass = computed(
  () => props.size && [WIDTHS[props.size], props.size === 'lg' && FULL_ON_PHONE],
);
const labelledBy = computed(
  () => (attrs['aria-labelledby'] as string | undefined) ?? (props.title ? titleId : undefined),
);

const body = useTemplateRef<HTMLElement>('body');
const footer = useTemplateRef<HTMLElement>('footer');
const FIRST_FIELD = 'input:not([type=hidden]):not(:disabled), select, textarea';
const FIRST_FOOTER_BUTTON = 'button:not(:disabled):not([aria-disabled=true])';
/** `[autofocus]` first, then a field, then the footer's first enabled button (Cancel on a confirm), then the close button. */
const initialFocus = (dialog: HTMLDialogElement) =>
  body.value?.querySelector<HTMLElement>('[autofocus]') ??
  body.value?.querySelector<HTMLElement>(FIRST_FIELD) ??
  footer.value?.querySelector<HTMLElement>(FIRST_FOOTER_BUTTON) ??
  dialog.querySelector<HTMLElement>('[data-modal-close]');

const handlers = useModalDialog(useTemplateRef<HTMLDialogElement>('dialog'), visible, {
  isClosable: () => props.closable,
  isDismissable: () => props.dismissable,
  initialFocus,
});
</script>

<template>
  <!-- Created on open, so the dialog comes last in <body>: the newest overlay is last in DOM order too. -->
  <Teleport v-if="visible" to="body">
    <dialog
      ref="dialog"
      v-bind="attrs"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="labelledBy"
      class="m-auto max-h-[calc(100dvh-2rem)] w-[min(28rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] flex-col rounded-card overlay-surface p-0 text-content outline-none transition-[opacity,scale] duration-(--qh-duration) ease-standard backdrop:bg-ground/70 backdrop:transition-opacity backdrop:duration-(--qh-duration-fast) open:flex starting:open:scale-96 starting:open:opacity-0 starting:open:backdrop:opacity-0"
      :class="sizeClass"
      @cancel="handlers.onCancel"
      @close="handlers.onClose"
      @pointerdown="handlers.onPointerdown"
      @click="handlers.onClick"
    >
      <header
        class="flex shrink-0 items-start justify-between gap-3 px-(--qh-pad-dialog) pt-(--qh-pad-dialog)"
      >
        <slot name="header">
          <h2 :id="titleId" class="m-0 font-display text-section font-semibold">
            {{ title }}
          </h2>
        </slot>
        <IconButton
          v-if="closable"
          data-modal-close
          :label="$t('common.close')"
          @click="visible = false"
        >
          <X aria-hidden="true" />
        </IconButton>
      </header>
      <!-- A dialog taller than the screen scrolls here, so the header (close button) and footer stay on screen. -->
      <div ref="body" class="min-h-0 overflow-y-auto px-(--qh-pad-dialog) py-4"><slot /></div>
      <footer
        v-if="$slots.footer"
        ref="footer"
        class="flex shrink-0 justify-end gap-2 px-(--qh-pad-dialog) pb-(--qh-pad-dialog)"
      >
        <slot name="footer" />
      </footer>
    </dialog>
  </Teleport>
</template>
