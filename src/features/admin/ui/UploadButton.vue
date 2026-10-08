<script setup lang="ts">
import { ref, useId } from 'vue';
import { formatFileSize } from '@/lib/format';
import { ADMIN_BUTTON_CLASS } from './classes';
import { tooLargeFor } from './upload-limits';

const props = defineProps<{
  label: string;
  accept?: string;
  maxBytes?: number;
  isPending?: boolean;
}>();
const emit = defineEmits<{ picked: [file: File] }>();
const id = useId();
const refusal = ref('');

function onChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const [file] = input.files ?? [];
  input.value = '';
  refusal.value = '';
  if (!file || props.isPending) return;
  if (props.maxBytes !== undefined && tooLargeFor(file, props.maxBytes)) {
    refusal.value = formatFileSize(props.maxBytes);
    return;
  }
  emit('picked', file);
}
</script>

<template>
  <span class="inline-flex flex-col gap-1">
    <label
      :for="id"
      :class="ADMIN_BUTTON_CLASS"
      class="cursor-pointer focus-within:ring-2 focus-within:ring-accent"
      :aria-disabled="isPending ? 'true' : undefined"
    >
      {{ label }}
      <input
        :id="id"
        type="file"
        class="sr-only"
        :accept="accept"
        :aria-describedby="refusal ? `${id}-error` : undefined"
        @change="onChange"
      />
    </label>
    <span v-if="refusal" :id="`${id}-error`" role="alert" class="text-sm text-negative">
      {{ $t('admin.ui.tooLarge', { max: refusal }) }}
    </span>
  </span>
</template>
