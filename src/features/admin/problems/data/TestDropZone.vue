<script setup lang="ts">
import { ref } from 'vue';
import { FileUp } from 'lucide-vue-next';
import UploadButton from '@/components/ui/UploadButton.vue';

/**
 * Where test data comes in: drop one `.zip`, or loose input and output files, on the box, or pick them with "Chọn tệp"
 * (the same set, for keyboard and phone). It only hands the files over (`files`); a dropped folder is reported
 * (`folder`), because its files cannot be read as a flat set.
 */
defineProps<{ isPending: boolean }>();
const emit = defineEmits<{ files: [files: File[]]; folder: [] }>();
const KEY = 'admin.problems.data.drop';
const isOver = ref(false);

function onDrop(event: DragEvent) {
  isOver.value = false;
  const transfer = event.dataTransfer;
  if (!transfer) return;
  const hasFolder = [...transfer.items].some((item) => item.webkitGetAsEntry?.()?.isDirectory);
  if (hasFolder) emit('folder');
  else emit('files', [...transfer.files]);
}
</script>

<template>
  <div
    data-testid="test-drop-zone"
    class="flex flex-wrap items-center gap-3 rounded-card border border-dashed p-4"
    :class="isOver ? 'border-accent bg-accent-soft' : 'border-line-control bg-surface'"
    @dragenter.prevent="isOver = true"
    @dragover.prevent="isOver = true"
    @dragleave="isOver = false"
    @drop.prevent="onDrop"
  >
    <FileUp aria-hidden="true" class="size-6 shrink-0 text-muted" />
    <div class="min-w-0 flex-1 basis-64">
      <p class="m-0 font-semibold">{{ $t(`${KEY}.title`) }}</p>
      <p class="m-0 text-meta text-muted">
        {{ $t(`${KEY}.hint`) }}
      </p>
    </div>
    <UploadButton
      data-testid="upload-archive"
      multiple
      :label="$t(`${KEY}.pick`)"
      :is-pending="isPending"
      @picked-files="emit('files', $event)"
    />
  </div>
</template>
