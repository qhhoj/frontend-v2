<script setup lang="ts">
import { FileText, FileUp, X } from 'lucide-vue-next';
import { ref, useId } from 'vue';
import type { Language } from '@/api/types/problems';
import { formatFileSize } from '@/lib/format';
import { acceptedExtension, uploadCapBytes } from '@/lib/source';

defineProps<{
  language: Language;
  file: File | null;
  /** The language takes no upload at all (`fileSizeLimit` 0): a static box, no input. */
  disabled: boolean;
  /** The id of the error line, so a screen reader reads it with the input. */
  describedBy?: string;
}>();
const emit = defineEmits<{ choose: [file: File]; remove: [] }>();
const inputId = useId();
const input = ref<HTMLInputElement | null>(null);
const isDraggingOver = ref(false);

function onPicked(event: Event) {
  const field = event.target as HTMLInputElement;
  const [file] = field.files ?? [];
  field.value = ''; // the same file picked twice must fire `change` again
  if (file) emit('choose', file);
}
function onDropped(event: DragEvent) {
  isDraggingOver.value = false;
  const [file] = event.dataTransfer?.files ?? [];
  if (file) emit('choose', file);
}
function removeFile() {
  emit('remove');
  input.value?.focus();
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <p
      v-if="disabled"
      aria-disabled="true"
      class="rounded-tile border border-dashed border-line p-4 text-sm text-muted"
    >
      {{ $t('submit.file.uploadDisabled') }}
    </p>
    <template v-else>
      <input
        :id="inputId"
        ref="input"
        type="file"
        :accept="acceptedExtension(language)"
        :aria-describedby="describedBy"
        class="peer sr-only"
        @change="onPicked"
      />
      <label
        :for="inputId"
        class="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-tile border border-dashed border-line-accent bg-accent-soft p-3 text-center text-sm text-accent-soft-text peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus"
        :class="{ 'bg-surface-hover': isDraggingOver }"
        @dragover.prevent="isDraggingOver = true"
        @dragleave="isDraggingOver = false"
        @drop.prevent="onDropped"
      >
        <FileUp class="size-6" aria-hidden="true" />
        <span class="font-semibold">{{
          $t('submit.file.choose', { extension: acceptedExtension(language) })
        }}</span>
        <span class="text-xs text-muted">{{
          $t('submit.file.limit', { size: formatFileSize(uploadCapBytes(language)) })
        }}</span>
      </label>
    </template>
    <div
      v-if="file && !disabled"
      class="flex items-center gap-2 rounded-tile bg-surface-strong py-1 pr-1 pl-3 text-sm"
    >
      <FileText class="size-5 shrink-0 text-muted" aria-hidden="true" />
      <span class="min-w-0 flex-1 truncate" :title="file.name">{{ file.name }}</span>
      <span class="shrink-0 font-mono text-xs text-muted">{{ formatFileSize(file.size) }}</span>
      <button
        type="button"
        :aria-label="$t('submit.file.remove')"
        class="flex size-11 shrink-0 items-center justify-center rounded-pill text-muted hover:bg-surface-hover"
        @click="removeFile"
      >
        <X class="size-4" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
