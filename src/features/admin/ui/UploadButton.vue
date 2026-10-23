<script setup lang="ts">
import { ref, useId } from 'vue';
import { formatFileSize } from '@/lib/format';
import { BUTTON } from './controls';
import { tooLargeFor } from './upload-limits';

/**
 * Checks the size locally and refuses a pick while an upload runs (said in words, never dropped silently).
 * Server answers (413, 429) belong to the consumer, which shows them through `failureTextOf`.
 */
const props = defineProps<{
  label: string;
  accept?: string;
  maxBytes?: number;
  isPending?: boolean;
  /** A fixed id, so another element (an avatar tile) can be a `<label for>` of the same file input. */
  inputId?: string;
}>();
/** `attempt`: any pick, before the checks, so a consumer can retire the answer to the previous one. */
const emit = defineEmits<{ picked: [file: File]; attempt: [] }>();
const generatedId = useId();
const id = props.inputId ?? generatedId;
const refusal = ref('');
const isBusyNoticeShown = ref(false);

function onChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const [file] = input.files ?? [];
  input.value = '';
  refusal.value = '';
  isBusyNoticeShown.value = false;
  if (!file) return;
  if (props.isPending) {
    isBusyNoticeShown.value = true;
    return;
  }
  emit('attempt');
  if (props.maxBytes !== undefined && tooLargeFor(file, props.maxBytes)) {
    refusal.value = formatFileSize(props.maxBytes);
    return;
  }
  emit('picked', file);
}

/** Forgets the last refusal, for a consumer whose state moved on (the file it was about is gone). */
function clear() {
  refusal.value = '';
  isBusyNoticeShown.value = false;
}
defineExpose({ clear });
</script>

<template>
  <span class="inline-flex flex-col gap-1">
    <label
      :for="id"
      :class="BUTTON.secondary"
      class="cursor-pointer focus-within:ring-2 focus-within:ring-accent"
    >
      {{ isPending ? $t('admin.ui.uploading') : label }}
      <input
        :id="id"
        type="file"
        class="sr-only"
        :accept="accept"
        :disabled="isPending"
        :aria-describedby="refusal ? `${id}-error` : isBusyNoticeShown ? `${id}-busy` : undefined"
        @change="onChange"
      />
    </label>
    <span v-if="refusal" :id="`${id}-error`" role="alert" class="text-sm text-negative">
      {{ $t('admin.ui.tooLarge', { max: refusal }) }}
    </span>
    <span v-if="isBusyNoticeShown" :id="`${id}-busy`" role="status" class="text-sm text-muted">
      {{ $t('admin.ui.uploadBusy') }}
    </span>
  </span>
</template>
