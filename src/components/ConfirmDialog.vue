<script setup lang="ts">
import Dialog from 'primevue/dialog';
import { computed, nextTick, onBeforeUnmount, useId, watch } from 'vue';

/**
 * One confirm step for the destructive or irreversible choices, on the shared Dialog preset.
 * `confirm` only says the user chose it: the consumer closes the dialog (set `visible` false) once its request is done.
 * Busy blocks Cancel, Escape and the close button, and a second confirm, until the consumer clears it.
 * `canConfirm` is false while a required input in the body (a code, a password) is still empty: the confirm button turns
 * `aria-disabled` (focus is kept) and neither it nor Enter confirms.
 * The body is a `<form>` and the confirm button (in the footer, outside it) submits it by id, so Enter in an input and a click
 * each emit once. Focus returns to the element that opened it (PrimeVue restores it when the dialog hides).
 * `returnFocusTo` names where focus lands when the dialog closes after a confirm (not after Cancel, Escape or the close button):
 * pass it when the opener row disappears with the confirmed action, so PrimeVue has nothing to return focus to.
 * The body is `body` or the default slot; the `error` slot shows a failed confirm inside the dialog.
 * A `<button>` in the body needs `type="button"`, or it submits the form and confirms.
 */
const props = withDefaults(
  defineProps<{
    title: string;
    body?: string;
    confirmLabel: string;
    cancelLabel?: string;
    tone?: 'neutral' | 'danger';
    busy?: boolean;
    canConfirm?: boolean;
    returnFocusTo?: () => HTMLElement | null | undefined;
  }>(),
  {
    body: undefined,
    cancelLabel: undefined,
    tone: 'neutral',
    busy: false,
    canConfirm: true,
    returnFocusTo: undefined,
  },
);
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ confirm: [] }>();
const bodyId = useId();
const cannotConfirm = computed(() => props.busy || !props.canConfirm);

let isConfirmed = false;

/** The user closing the dialog without a confirm (Cancel, Escape, the close button) cancels the pending focus return. */
function dismiss(next: boolean) {
  visible.value = next;
  if (!next) isConfirmed = false;
}
function cancel() {
  if (!props.busy) dismiss(false);
}
/** The form's submit (Enter, or the confirm button): the one place that emits. */
function confirm() {
  if (cannotConfirm.value) return;
  isConfirmed = true;
  emit('confirm');
}

/** The consumer closes (or unmounts) the dialog once the confirmed request is done: focus then goes to the named target. */
function returnFocus() {
  if (!isConfirmed) return;
  isConfirmed = false;
  void nextTick(() => props.returnFocusTo?.()?.focus());
}
watch(visible, (isOpen) => !isOpen && returnFocus(), { flush: 'post' });
onBeforeUnmount(returnFocus);
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :header="title"
    :draggable="false"
    :closable="!busy"
    :close-on-escape="!busy"
    :close-button-props="{ 'aria-label': $t('common.close') }"
    :aria-describedby="bodyId"
    @update:visible="dismiss"
  >
    <form :id="bodyId" class="flex flex-col gap-3" @submit.prevent="confirm">
      <p v-if="body" class="text-muted">{{ body }}</p>
      <slot />
      <slot name="error" />
    </form>
    <template #footer>
      <button
        type="button"
        :aria-disabled="busy || undefined"
        class="min-h-11 rounded-pill border border-line px-5 font-semibold hover:bg-surface-hover aria-disabled:cursor-not-allowed aria-disabled:bg-surface-hover aria-disabled:text-muted"
        @click="cancel"
      >
        {{ cancelLabel ?? $t('common.cancel') }}
      </button>
      <button
        type="submit"
        :form="bodyId"
        :aria-disabled="cannotConfirm || undefined"
        :aria-busy="busy || undefined"
        :class="
          tone === 'danger'
            ? 'min-h-11 rounded-pill border border-negative px-5 font-semibold text-negative aria-disabled:cursor-progress aria-disabled:bg-surface-hover aria-disabled:text-muted'
            : 'min-h-11 rounded-pill bg-gradient-accent px-5 font-semibold text-on-accent aria-disabled:cursor-progress aria-disabled:bg-none aria-disabled:bg-accent-soft aria-disabled:text-accent-soft-text'
        "
      >
        {{ confirmLabel }}
      </button>
    </template>
  </Dialog>
</template>
