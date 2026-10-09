<script setup lang="ts">
import { Search, X } from 'lucide-vue-next';
import { ref, useId } from 'vue';
import { useDebouncedText } from '@/lib/use-debounced-text';
import { ADMIN_BUTTON_CLASS, ADMIN_INPUT_CLASS } from '../ui/classes';

const props = defineProps<{
  value: string;
  label: string;
  placeholder: string;
  clearLabel: string;
  hint?: string;
  /** What the list shows for the current text (its result count); announced politely when it changes. */
  status?: string;
}>();
const emit = defineEmits<{ commit: [text: string] }>();
const id = useId();
const input = ref<HTMLInputElement | null>(null);
const text = useDebouncedText(
  () => props.value,
  (committed) => emit('commit', committed),
);

/** Clearing takes effect at once (no pause) and leaves the caret in the box. */
function clear() {
  text.commitNow('');
  input.value?.focus();
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="sr-only">{{ label }}</label>
    <div class="flex items-center gap-2">
      <div class="relative min-w-0 flex-1">
        <Search
          class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          :id="id"
          ref="input"
          v-model="text"
          type="search"
          :class="[ADMIN_INPUT_CLASS, 'pl-9']"
          :placeholder="placeholder"
          :aria-describedby="hint ? `${id}-hint` : undefined"
          autocomplete="off"
        />
      </div>
      <button
        v-if="text"
        type="button"
        :class="[ADMIN_BUTTON_CLASS, '!px-0 w-11']"
        :aria-label="clearLabel"
        @click="clear"
      >
        <X class="size-4" aria-hidden="true" />
      </button>
    </div>
    <p v-if="hint" :id="`${id}-hint`" class="text-xs text-muted">{{ hint }}</p>
    <p aria-live="polite" class="sr-only">{{ status }}</p>
  </div>
</template>
