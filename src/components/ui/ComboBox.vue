<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';
import Select from 'primevue/select';
import { computed } from 'vue';
import { useFieldControl } from './FormField.control';

/**
 * A long pick-list: PrimeVue `Select` framed like a `TextInput` (44 px tall, 16 px text, 12 px corners). `options` are
 * `{ value, label }` (`optionLabel` / `optionValue` rename the keys); `filter` adds the search box in the list (its `@filter`
 * event carries the text for a server-side search), `loading` shows a fetch in progress, `clearable` lets the choice be taken
 * back (the model becomes null). Slots `#value` and `#option` draw a custom choice. Inside a `FormField` it takes the field's
 * id and description; otherwise name it with `aria-label` or `aria-labelledby`. Extra attributes go to the select.
 */
const model = defineModel<string | number | null>();
const props = withDefaults(
  defineProps<{
    options: object[];
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
const field = useFieldControl();
const isInvalid = computed(() => props.invalid || field?.value.invalid === 'true');
const passThrough = computed(() => ({
  root: {
    class: [
      'relative flex h-(--qh-control) w-full min-w-0 cursor-pointer items-center rounded-cell border bg-surface-solid pl-3 text-base text-content has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
      isInvalid.value ? 'border-negative' : 'border-line-control',
    ],
  },
  // The empty state is the placeholder: muted, so it does not read as a chosen value.
  label: {
    class:
      'min-h-11 flex-1 truncate py-2 focus-visible:outline-none data-[p~=placeholder]:text-muted',
    id: field?.value.id,
    'aria-describedby': props.describedBy ?? field?.value.describedBy,
  },
  pcFilter: { root: { class: 'text-base', 'aria-label': props.filterLabel } },
}));
</script>

<template>
  <Select
    v-model="model"
    :options="options"
    :option-label="optionLabel"
    :option-value="optionValue"
    :placeholder="placeholder"
    :filter="filter"
    :filter-placeholder="filterPlaceholder"
    :empty-filter-message="emptyFilterMessage"
    :loading="loading"
    :show-clear="clearable"
    :invalid="isInvalid"
    :pt="passThrough"
  >
    <template v-for="(_, name) in $slots" :key="name" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
    <template v-if="!$slots.dropdownicon" #dropdownicon>
      <ChevronDown class="size-4" aria-hidden="true" />
    </template>
  </Select>
</template>
