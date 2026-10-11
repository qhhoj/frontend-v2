<script setup lang="ts">
import { ref, useId } from 'vue';
import { BUTTON, INPUT } from './controls';

defineProps<{ label: string; submitLabel: string; hint?: string }>();
const emit = defineEmits<{ open: [value: string] }>();
const id = useId();
const typed = ref('');
const submit = () => {
  if (typed.value.trim()) emit('open', typed.value.trim());
};
</script>

<template>
  <form class="flex flex-wrap items-end gap-2" @submit.prevent="submit">
    <div class="flex min-w-60 flex-1 flex-col gap-1.5">
      <label :for="id" class="text-sm font-semibold">{{ label }}</label>
      <input
        :id="id"
        v-model="typed"
        :class="INPUT"
        autocomplete="off"
        :aria-describedby="hint ? `${id}-hint` : undefined"
      />
    </div>
    <button type="submit" :class="BUTTON.secondary">{{ submitLabel }}</button>
    <p v-if="hint" :id="`${id}-hint`" class="basis-full text-xs text-muted">{{ hint }}</p>
  </form>
</template>
