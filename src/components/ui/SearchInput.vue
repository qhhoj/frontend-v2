<script setup lang="ts">
import { Search, X } from 'lucide-vue-next';
import { onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';
import { FIELD_FRAME, FIELD_INPUT } from './FormField.control';
import { useSplitAttrs } from './split-attrs';

/**
 * The search box of a list: the field frame (40 px, 44 on touch; `FormField.control.ts`) with a magnifier at the left and a clear button
 * once there is text (`clearable`, on by default). `debounce` (ms) delays `v-model` after typing stops; without it every
 * keystroke updates it. Clearing applies at once. `label` is the accessible name; `class` goes to the frame, other
 * attributes (`maxlength`, `@keydown`) to the input.
 */
defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{ label: string; placeholder?: string; debounce?: number; clearable?: boolean }>(),
  { placeholder: undefined, debounce: 0, clearable: true },
);
const model = defineModel<string>({ default: '' });
const { frame, input } = useSplitAttrs();
const typed = ref(model.value);
let timer: ReturnType<typeof setTimeout> | undefined;

watch(typed, (text) => {
  clearTimeout(timer);
  if (!props.debounce || text === '') return commit(text);
  timer = setTimeout(() => commit(text), props.debounce);
});
watch(model, (text) => {
  if (timer === undefined && text !== typed.value) typed.value = text;
});
onBeforeUnmount(() => clearTimeout(timer));

function commit(text: string) {
  timer = undefined;
  if (text !== model.value) model.value = text;
}
const field = useTemplateRef<HTMLInputElement>('field');
/** A click on the frame (the magnifier, the padding) focuses the input. */
const focusInput = () => field.value?.focus();
function clear() {
  typed.value = '';
  focusInput();
}
</script>

<template>
  <div v-bind="frame" :class="FIELD_FRAME" @click="focusInput">
    <Search aria-hidden="true" class="size-4 shrink-0 text-muted" />
    <input
      v-bind="input"
      ref="field"
      v-model="typed"
      type="search"
      :aria-label="label"
      :placeholder="placeholder ?? label"
      :class="`${FIELD_INPUT} [&::-webkit-search-cancel-button]:hidden`"
    />
    <button
      v-if="clearable && typed"
      type="button"
      class="-mr-2 flex size-(--qh-control-sm) shrink-0 cursor-pointer items-center justify-center rounded-control text-muted hover:text-content"
      :aria-label="$t('common.clearSearch')"
      :title="$t('common.clearSearch')"
      @click.stop="clear"
    >
      <X aria-hidden="true" class="size-4" />
    </button>
  </div>
</template>
