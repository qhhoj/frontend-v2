<script setup lang="ts">
import { Upload } from 'lucide-vue-next';
import { computed, useId } from 'vue';
import { buttonClasses } from '@/components/ui/button-classes';

const props = defineProps<{ iconOnly: boolean }>();
const emit = defineEmits<{ pick: [file: File] }>();
const inputId = useId();
/** A label styled as a button: the file input stays native and only the label is seen. */
const labelClass = computed(() => buttonClasses({ iconOnly: props.iconOnly }));

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
      class="cursor-pointer peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus"
      :class="labelClass"
    >
      <Upload class="size-4" aria-hidden="true" />
      <span :class="{ 'sr-only': iconOnly }">{{ $t('submit.upload') }}</span>
    </label>
  </span>
</template>
