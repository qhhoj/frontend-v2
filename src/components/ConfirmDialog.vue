<script setup lang="ts">
import Dialog from 'primevue/dialog';
import { useId } from 'vue';

/**
 * One confirm step for the destructive or irreversible choices, on the shared Dialog preset.
 * `confirm` only says the user chose it: the consumer closes the dialog (set `visible` false) once its request is done.
 * Busy blocks Cancel, Escape and the close button, and a second confirm, until the consumer clears it.
 * The body is `body` or the default slot; the `error` slot shows a failed confirm inside the dialog.
 */
const props = defineProps<{
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'neutral' | 'danger';
  busy?: boolean;
}>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ confirm: [] }>();
const bodyId = useId();

function cancel() {
  if (!props.busy) visible.value = false;
}
function confirm() {
  if (!props.busy) emit('confirm');
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="title"
    :draggable="false"
    :closable="!busy"
    :close-on-escape="!busy"
    :aria-describedby="bodyId"
  >
    <div :id="bodyId" class="flex flex-col gap-3">
      <p v-if="body" class="text-muted">{{ body }}</p>
      <slot />
      <slot name="error" />
    </div>
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
        type="button"
        :aria-disabled="busy || undefined"
        :aria-busy="busy || undefined"
        :class="
          tone === 'danger'
            ? 'min-h-11 rounded-pill border border-negative px-5 font-semibold text-negative aria-disabled:cursor-progress aria-disabled:bg-surface-hover aria-disabled:text-muted'
            : 'min-h-11 rounded-pill bg-gradient-accent px-5 font-semibold text-on-accent aria-disabled:cursor-progress aria-disabled:bg-none aria-disabled:bg-accent-soft aria-disabled:text-accent-soft-text'
        "
        @click="confirm"
      >
        {{ confirmLabel }}
      </button>
    </template>
  </Dialog>
</template>
