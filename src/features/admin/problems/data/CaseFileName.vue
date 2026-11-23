<script setup lang="ts">
import { nextTick, ref, useTemplateRef } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import TextInput from '@/components/ui/TextInput.vue';

/**
 * A file name in the test table: plain mono text, as in the mock, until the teacher clicks it. Then it is a text box
 * (with the archive's file names as suggestions) and goes back to text on Enter or when it loses focus. An empty name
 * shows the label as a hint, so a test with no file can still be reached.
 */
const name = defineModel<string>({ required: true });
defineProps<{ label: string; testid: string }>();
const isEditing = ref(false);
const box = useTemplateRef<{ $el: HTMLInputElement }>('box');

async function edit() {
  isEditing.value = true;
  await nextTick();
  box.value?.$el.focus();
}
</script>

<template>
  <TextInput
    v-if="isEditing"
    ref="box"
    v-model="name"
    class="font-mono"
    list="archive-files"
    autocomplete="off"
    spellcheck="false"
    :data-testid="testid"
    :aria-label="label"
    @blur="isEditing = false"
    @keydown.enter.prevent="isEditing = false"
  />
  <AppButton
    v-else
    tone="plain"
    :data-testid="testid"
    :aria-label="label"
    :title="label"
    class="inline-flex min-h-(--qh-control-sm) max-w-full cursor-text items-center rounded-control px-1 text-left font-mono break-all hover:bg-surface-hover"
    @click="edit"
  >
    <span :class="name === '' ? 'text-muted' : ''">{{ name === '' ? label : name }}</span>
  </AppButton>
</template>
