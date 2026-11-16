<script setup lang="ts">
import { Search, X } from 'lucide-vue-next';
import { onBeforeUnmount, ref, watch } from 'vue';
import { useSplitAttrs } from './split-attrs';

/**
 * The search box of a list: magnifier at the left, 16 px text, a control tall (44 px; 36 in admin), and a clear button
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
const clear = () => (typed.value = '');
</script>

<template>
  <div v-bind="frame" class="relative min-w-0">
    <Search
      aria-hidden="true"
      class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
    />
    <input
      v-bind="input"
      v-model="typed"
      type="search"
      :aria-label="label"
      :placeholder="placeholder ?? label"
      class="h-(--qh-control) w-full min-w-0 appearance-none rounded-cell border border-line-control bg-surface-solid pr-11 pl-9 text-base text-content placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
    />
    <button
      v-if="clearable && typed"
      type="button"
      class="absolute top-1/2 right-0 flex size-(--qh-control) -translate-y-1/2 items-center justify-center rounded-cell text-muted hover:text-content"
      :aria-label="$t('common.clearSearch')"
      @click="clear"
    >
      <X aria-hidden="true" class="size-4" />
    </button>
  </div>
</template>
