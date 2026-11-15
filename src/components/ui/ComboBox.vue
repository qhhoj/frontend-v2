<script setup lang="ts" generic="Option extends object">
import { ChevronDown, LoaderCircle, Search, X } from 'lucide-vue-next';
import { computed, nextTick, ref, useAttrs, useId, useTemplateRef, watch } from 'vue';
import { useFieldControl } from './FormField.control';
import { yieldsToComposition } from './keys';
import { usePopup } from './popup';

/**
 * A long pick-list framed like a `TextInput` (44 px tall, 16 px text, 12 px corners): a select-only combobox over our own
 * listbox (WAI-ARIA 1.2), the list in the top layer beside it (`popup.ts`). `options` are `{ value, label }` (`optionLabel` /
 * `optionValue` rename the keys). `filter` adds a search box in the list: the list narrows to labels containing the text, and
 * the `filter` event carries it for a server-side search. `loading` shows a fetch in progress, `clearable` lets the choice be
 * taken back (the model becomes null; Delete or Backspace on the box). Slots `#value` ({ value, placeholder }) and `#option`
 * ({ option, selected }) draw a custom choice. Keys: Enter, Space and the arrows open; in the list the arrows move (Home and
 * End too without a search box), Enter picks, Escape closes (its own, not a dialog's), Tab closes and moves on. Inside a
 * `FormField` it takes the field's id and description; otherwise name it with `aria-label` or `aria-labelledby`. Extra
 * attributes go to the combobox.
 */
defineOptions({ inheritAttrs: false });
const model = defineModel<string | number | null>();
const props = withDefaults(
  defineProps<{
    options: Option[];
    optionLabel?: string;
    optionValue?: string;
    placeholder?: string;
    filter?: boolean;
    filterPlaceholder?: string;
    emptyFilterMessage?: string;
    /** The search box's accessible name (it has no visible label). */
    filterLabel?: string;
    /** Ids of elements that describe the box (an error line), when it is not inside a `FormField`. */
    describedBy?: string;
    loading?: boolean;
    clearable?: boolean;
    invalid?: boolean;
  }>(),
  {
    optionLabel: 'label',
    optionValue: 'value',
    placeholder: undefined,
    filterPlaceholder: undefined,
    emptyFilterMessage: undefined,
    filterLabel: undefined,
    describedBy: undefined,
  },
);
const emit = defineEmits<{ filter: [event: { value: string }] }>();
const attrs = useAttrs();
const field = useFieldControl();
const listId = useId();
const box = useTemplateRef<HTMLElement>('box');
const panel = useTemplateRef<HTMLElement>('panel');
const search = useTemplateRef<HTMLInputElement>('search');
const popup = usePopup(panel, () => popup.close());
const query = ref('');
/** The active option's index in `shown`, -1 for none. */
const active = ref(-1);

const keyOf = (option: Option, key: string) => (option as Record<string, unknown>)[key];
const valueOf = (option: Option) => keyOf(option, props.optionValue) as string | number;
function labelOf(option: Option) {
  const label = keyOf(option, props.optionLabel);
  return typeof label === 'string' || typeof label === 'number' ? String(label) : '';
}
const selected = computed(() => props.options.find((option) => valueOf(option) === model.value));
const shown = computed(() => {
  const text = query.value.trim().toLocaleLowerCase('vi');
  if (!text) return props.options;
  return props.options.filter((option) => labelOf(option).toLocaleLowerCase('vi').includes(text));
});
/** The listbox carries the combobox's own name. */
const listName = computed(() => ({
  'aria-label': attrs['aria-label'] as string | undefined,
  'aria-labelledby': attrs['aria-labelledby'] as string | undefined,
}));
const isInvalid = computed(() => props.invalid || field?.value.invalid === 'true');
const hasChoice = computed(() => model.value !== null && model.value !== undefined);
const optionId = (index: number) => `${listId}-${index}`;
const activeId = computed(() =>
  popup.isOpen.value && active.value >= 0 ? optionId(active.value) : undefined,
);
/** jsdom has no `scrollIntoView`. */
const revealActive = () =>
  document.getElementById(activeId.value ?? '')?.scrollIntoView?.({ block: 'nearest' });

function open() {
  query.value = '';
  active.value = Math.max(
    0,
    props.options.findIndex((option) => valueOf(option) === model.value),
  );
  popup.open(box.value);
}
function close(refocus = true) {
  popup.close();
  if (refocus) box.value?.focus();
}
function pick(option: Option) {
  model.value = valueOf(option);
  close();
}
watch(
  panel,
  async (element) => {
    if (!element) return;
    await nextTick();
    search.value?.focus({ preventScroll: true });
    revealActive();
  },
  { flush: 'post' },
);
watch(
  query,
  (value) => {
    active.value = shown.value.length ? 0 : -1;
    emit('filter', { value });
  },
  { flush: 'sync' },
);

function move(to: number) {
  active.value = Math.min(Math.max(to, 0), shown.value.length - 1);
  void nextTick(revealActive);
}
function pickActive() {
  const option = shown.value[active.value];
  if (option) pick(option);
}
/** The keys of the open list; Home, End and Space stay the search box's while there is one. */
const listKeys = computed<Record<string, () => void>>(() => ({
  ArrowDown: () => move(active.value + 1),
  ArrowUp: () => move(active.value - 1),
  Enter: pickActive,
  Escape: () => close(),
  ...(props.filter
    ? {}
    : { Home: () => move(0), End: () => move(shown.value.length - 1), ' ': pickActive }),
}));
function onListKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') event.stopPropagation(); // the submit sheet closes on any Escape that reaches it
  if (yieldsToComposition(event)) return; // an input method's Enter or Escape is its own
  if (event.key === 'Tab') return close();
  const action = listKeys.value[event.key];
  if (!action) return;
  event.preventDefault();
  action();
}
const OPEN_KEYS = new Set(['Enter', ' ', 'ArrowDown', 'ArrowUp']);
/** On the box: opening (or clearing) keys while closed, the list keys while open without a search box. */
function onBoxKeydown(event: KeyboardEvent) {
  if (popup.isOpen.value) return onListKeydown(event);
  if (props.clearable && (event.key === 'Delete' || event.key === 'Backspace')) {
    model.value = null;
  } else if (OPEN_KEYS.has(event.key)) {
    event.preventDefault();
    open();
  }
}
</script>

<template>
  <div
    :id="field?.id"
    ref="box"
    v-bind="attrs"
    role="combobox"
    tabindex="0"
    aria-haspopup="listbox"
    :aria-expanded="popup.isOpen.value"
    :aria-controls="popup.isOpen.value ? listId : undefined"
    :aria-activedescendant="filter ? undefined : activeId"
    :aria-describedby="describedBy ?? field?.describedBy"
    :aria-invalid="isInvalid || undefined"
    :aria-busy="loading || undefined"
    class="relative flex h-(--qh-control) w-full min-w-0 cursor-pointer items-center rounded-cell border bg-surface-solid pl-2.5 text-meta text-content outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    :class="isInvalid ? 'border-negative' : 'border-line-control'"
    @click="popup.isOpen.value ? close() : open()"
    @keydown="onBoxKeydown"
  >
    <span class="flex-1 truncate" :class="!selected && 'text-muted'">
      <slot name="value" :value="model" :placeholder="placeholder">
        {{ selected ? labelOf(selected) : placeholder }}
      </slot>
    </span>
    <button
      v-if="clearable && hasChoice"
      type="button"
      tabindex="-1"
      class="flex size-8 items-center justify-center text-muted"
      :aria-label="$t('common.clearSelection')"
      @click.stop="model = null"
    >
      <X class="size-4" aria-hidden="true" />
    </button>
    <span class="flex w-10 items-center justify-center text-muted" aria-hidden="true">
      <LoaderCircle v-if="loading" class="size-4 animate-spin" />
      <ChevronDown v-else class="size-4" />
    </span>
  </div>
  <Teleport v-if="popup.isOpen.value" :to="popup.host.value">
    <div
      ref="panel"
      popover="manual"
      data-popup
      class="rounded-row border border-line-strong bg-surface-solid p-1 text-content shadow-float"
      :style="{ minWidth: `${box?.offsetWidth ?? 0}px` }"
    >
      <div v-if="filter" class="relative p-1">
        <Search
          class="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          ref="search"
          v-model="query"
          type="text"
          role="searchbox"
          autocomplete="off"
          :aria-label="filterLabel"
          :aria-controls="listId"
          :aria-activedescendant="activeId"
          :placeholder="filterPlaceholder"
          class="h-(--qh-control) w-full rounded-cell border border-line-control bg-surface-solid pr-2.5 pl-8 text-meta text-content placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          @keydown="onListKeydown"
        />
      </div>
      <!-- mousedown.prevent: picking with the mouse keeps focus in the search box until the pick returns it to the box. -->
      <ul
        :id="listId"
        v-bind="listName"
        role="listbox"
        class="m-0 max-h-72 list-none overflow-auto p-0"
        @mousedown.prevent
      >
        <li
          v-for="(option, index) in shown"
          :id="optionId(index)"
          :key="String(valueOf(option))"
          role="option"
          :aria-selected="valueOf(option) === model"
          class="flex min-h-(--qh-row) cursor-pointer items-center rounded-cell px-2.5 text-meta hover:bg-surface-hover touch:min-h-11"
          :class="[
            index === active && 'bg-surface-hover outline-2 -outline-offset-2 outline-focus',
            valueOf(option) === model && 'font-semibold text-accent-text',
          ]"
          @click="pick(option)"
        >
          <slot name="option" :option="option" :selected="valueOf(option) === model">
            {{ labelOf(option) }}
          </slot>
        </li>
      </ul>
      <p v-if="shown.length === 0 && emptyFilterMessage" class="m-0 px-3 py-2 text-sm text-muted">
        {{ emptyFilterMessage }}
      </p>
    </div>
  </Teleport>
</template>
