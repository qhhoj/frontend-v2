<!-- eslint-disable vue/multi-word-component-names -- the kit names primitives by role (docs/design-language.md). -->
<script setup lang="ts">
import { X } from 'lucide-vue-next';
import { computed, useId, useSlots, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import IconButton from './IconButton.vue';
import { useModalDialog } from './modal-dialog';

/**
 * The one side panel (edit a record, a menu sheet, a notification list). `side` right (default) / left / bottom; `size` sm
 * 400, md 560 or lg 720 px from 768 px up; below 768 px it fills the screen (a bottom sheet fills the width and caps its height).
 * A native modal `<dialog>` (`modal-dialog.ts`), named by its title: the page is inert and does not scroll, Escape (only the
 * topmost dialog's: a confirm opened over it takes the key alone) and a click on the scrim close it, and focus returns to the
 * opener; `hide` fires then. On open, focus goes to the first `[autofocus]` element, else to the title.
 * Slots: `meta` (chips under the title), `tabs` (fixed under the header), default (the scrolling body), `footer` (fixed,
 * e.g. a `SaveBar variant="footer"`).
 */
export type DrawerSide = 'right' | 'left' | 'bottom';
export type DrawerSize = 'sm' | 'md' | 'lg';
const props = withDefaults(
  defineProps<{ title: string; subtitle?: string; side?: DrawerSide; size?: DrawerSize }>(),
  { subtitle: undefined, side: 'right', size: 'md' },
);
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ hide: [] }>();
const slots = useSlots();
const { t } = useI18n();
const titleId = useId();
const body = useTemplateRef<HTMLElement>('body');
const heading = useTemplateRef<HTMLElement>('heading');

const WIDTHS: Record<DrawerSize, string> = {
  sm: 'md:w-[25rem]',
  md: 'md:w-[35rem]',
  lg: 'md:w-[45rem]',
};
/** Per side: where the panel sits, its edge line, and the slide it enters by. */
const SIDES: Record<DrawerSide, string> = {
  right: 'my-0 mr-0 ml-auto h-dvh max-h-none rounded-l-card starting:open:translate-x-6',
  left: 'my-0 mr-auto ml-0 h-dvh max-h-none rounded-r-card starting:open:-translate-x-6',
  bottom: 'mx-0 mt-auto mb-0 max-h-[85dvh] rounded-t-card starting:open:translate-y-6',
};
const panelClass = computed(() => [
  SIDES[props.side],
  'w-full',
  props.side !== 'bottom' && WIDTHS[props.size],
]);

const handlers = useModalDialog(useTemplateRef<HTMLDialogElement>('dialog'), visible, {
  isClosable: () => true,
  isDismissable: () => true,
  initialFocus: () => body.value?.querySelector<HTMLElement>('[autofocus]') ?? heading.value,
});
watch(visible, (isOpen, wasOpen) => wasOpen && !isOpen && emit('hide'), { flush: 'post' });
</script>

<template>
  <!-- Created on open, so the drawer comes last in <body>, after the overlays opened before it. -->
  <Teleport v-if="visible" to="body">
    <dialog
      ref="dialog"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      class="max-w-none flex-col overlay-surface p-0 text-content transition-[translate,opacity] duration-(--qh-duration) ease-standard backdrop:bg-ground/70 open:flex starting:open:opacity-0"
      :class="panelClass"
      @cancel="handlers.onCancel"
      @close="handlers.onClose"
      @pointerdown="handlers.onPointerdown"
      @click="handlers.onClick"
    >
      <header
        class="flex shrink-0 items-start gap-3 px-(--qh-pad-dialog) pt-(--qh-pad-dialog) pb-3"
      >
        <div class="min-w-0 flex-1">
          <h2
            :id="titleId"
            ref="heading"
            tabindex="-1"
            class="m-0 truncate section-title focus-visible:outline-none"
          >
            {{ title }}
          </h2>
          <p v-if="subtitle" class="m-0 truncate text-meta text-muted">{{ subtitle }}</p>
          <div v-if="slots.meta" class="mt-2 flex flex-wrap items-center gap-2">
            <slot name="meta" />
          </div>
        </div>
        <IconButton :label="t('common.close')" @click="visible = false">
          <X aria-hidden="true" />
        </IconButton>
      </header>
      <div v-if="slots.tabs" class="shrink-0 px-(--qh-pad-dialog)">
        <slot name="tabs" />
      </div>
      <div
        ref="body"
        class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-(--qh-pad-dialog) py-4"
      >
        <slot />
      </div>
      <footer
        v-if="slots.footer"
        class="flex shrink-0 flex-wrap items-center gap-2 px-(--qh-pad-dialog) pt-3 pb-[max(var(--qh-pad-dialog),env(safe-area-inset-bottom))]"
      >
        <slot name="footer" />
      </footer>
    </dialog>
  </Teleport>
</template>
