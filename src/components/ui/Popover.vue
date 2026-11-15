<!-- eslint-disable vue/multi-word-component-names -- the kit names primitives by role (docs/design-language.md). -->
<script setup lang="ts">
import { nextTick, useTemplateRef, watch } from 'vue';
import { FOCUSABLE, trapTab } from './focus-trap';
import { usePopup } from './popup';

/**
 * The one popover, a non-modal dialog beside its opener (`popup.ts`: top layer, anchored). It opens from `toggle($event)` of its
 * opener; focus moves to its first control (else the popover itself) and Tab stays inside. Escape closes it and focus returns
 * to the opener; so does `hide()`, for a popover closed from one of its own buttons, unless the action sent focus somewhere
 * else (a link that navigates, a field it opens). An outside click closes it and leaves focus where it was clicked.
 * Name it with `label`, or `labelledby` (the id of a title inside). `show` and `hide` fire on open and close.
 */
defineProps<{ label?: string; labelledby?: string }>();
const emit = defineEmits<{ show: []; hide: [] }>();

const panel = useTemplateRef<HTMLElement>('panel');
const popup = usePopup(panel, () => popup.close());

/** `preventScroll`: the popover is already beside its opener, the page must not jump to it. */
function focusFirstControl() {
  const first = panel.value?.querySelector<HTMLElement>(FOCUSABLE) ?? panel.value;
  first?.focus({ preventScroll: true });
}
watch(popup.isOpen, async (isOpen) => {
  if (!isOpen) {
    emit('hide');
    return;
  }
  await nextTick();
  focusFirstControl();
  emit('show');
});

function toggle(event: Event) {
  if (popup.isOpen.value) popup.close();
  else popup.open(event.currentTarget as HTMLElement | null);
}

function isFocusLost() {
  const active = document.activeElement;
  return !active || active === document.body || Boolean(panel.value?.contains(active));
}

function hide() {
  const returnsFocus = isFocusLost();
  popup.close();
  if (returnsFocus && popup.opener.value?.isConnected) popup.opener.value.focus();
}

/** Escape is taken here (`preventDefault`), so a dialog the popover sits in stays open. */
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' || event.code === 'Escape') {
    event.preventDefault();
    hide();
  } else if (event.key === 'Tab' && panel.value) trapTab(event, panel.value);
}

defineExpose({ toggle, hide });
</script>

<template>
  <Teleport v-if="popup.isOpen.value" :to="popup.host.value">
    <div
      ref="panel"
      popover="manual"
      data-popup
      role="dialog"
      tabindex="-1"
      :aria-label="label"
      :aria-labelledby="labelledby"
      class="rounded-row border border-line-strong bg-surface-solid p-4 text-content shadow-float outline-none"
      @keydown="onKeydown"
    >
      <slot />
    </div>
  </Teleport>
</template>
