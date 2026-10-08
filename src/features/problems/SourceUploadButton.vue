<script setup lang="ts">
import { Upload } from 'lucide-vue-next';
import { useId } from 'vue';

defineProps<{ iconOnly: boolean }>();
const emit = defineEmits<{ pick: [file: File] }>();
const inputId = useId();

function onPicked(event: Event) {
  const input = event.target as HTMLInputElement;
  const [file] = input.files ?? [];
  input.value = ''; // the same file picked twice must fire `change` again
  if (file) emit('pick', file);
}
</script>

<template>
  <span class="shrink-0">
    <input :id="inputId" type="file" class="peer sr-only" @change="onPicked" />
    <label
      :for="inputId"
      class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-pill border border-line bg-surface text-sm hover:bg-surface-hover peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus"
      :class="iconOnly ? 'size-12' : 'h-11 px-4'"
    >
      <Upload class="size-4" aria-hidden="true" />
      <span :class="{ 'sr-only': iconOnly }">{{ $t('submit.upload') }}</span>
    </label>
  </span>
</template>
