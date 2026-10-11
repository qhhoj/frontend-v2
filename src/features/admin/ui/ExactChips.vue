<script setup lang="ts" generic="Chip extends { id: string }">
import { computed, ref, useId } from 'vue';
import { failureTextOf, isNotFound } from './admin-errors';
import { needsPermissionText } from './permission-text';
import { X } from 'lucide-vue-next';
import { ADMIN_INPUT_CLASS } from './classes';
import { useChipSuggestions } from './use-chip-suggestions';
import type { Suggest } from './use-chip-suggestions';

const chips = defineModel<Chip[]>({ required: true });
const props = defineProps<{
  label: string;
  lookup: (typed: string) => Promise<Chip>;
  /** Offers chips while typing; Enter with none highlighted still runs the exact `lookup`. */
  suggest?: Suggest<Chip>;
  /** The chip's shown name: the looked-up name, or a short id while this session has not seen the name. */
  nameOf: (chip: Chip) => string;
  isNamed: (chip: Chip) => boolean;
  placeholder: string;
  noSuchText: (typed: string) => string;
  chipTestId: string;
  max?: number;
  error?: string;
  lockedBy?: string;
}>();
const id = useId();

/** Only a real `not_found` says the account or organization does not exist; a network drop or a 429 says its own thing. */
function lookupFailureText(error: unknown, typed: string): string {
  if (isNotFound(error)) return props.noSuchText(typed);
  return failureTextOf(error);
}
const typed = ref('');
const lookupError = ref('');
const isLooking = ref(false);
const describedBy = computed(() => {
  const ids = [
    props.lockedBy ? `${id}-locked` : null,
    isChipsFull.value ? `${id}-full` : null,
    lookupError.value || props.error ? `${id}-error` : null,
  ];
  return ids.filter(Boolean).join(' ') || undefined;
});
const suggestions = useChipSuggestions(
  typed,
  () => props.suggest,
  () => chips.value,
);
const listboxId = `${id}-suggestions`;
const optionId = (index: number) => `${listboxId}-${index}`;
const activeOptionId = computed(() =>
  suggestions.activeIndex.value < 0 ? undefined : optionId(suggestions.activeIndex.value),
);
const isChipsFull = computed(() => props.max !== undefined && chips.value.length >= props.max);

function pick(chip: Chip) {
  if (!chips.value.some((picked) => picked.id === chip.id)) chips.value = [...chips.value, chip];
  typed.value = '';
  lookupError.value = '';
}

function onEnter() {
  const chip = suggestions.active();
  if (chip) pick(chip);
  else void add();
}

async function add() {
  const text = typed.value.trim();
  if (!text || isLooking.value) return;
  isLooking.value = true;
  lookupError.value = '';
  try {
    const found = await props.lookup(text);
    if (!chips.value.some((chip) => chip.id === found.id)) chips.value = [...chips.value, found];
    typed.value = '';
  } catch (error) {
    lookupError.value = lookupFailureText(error, text);
  } finally {
    isLooking.value = false;
  }
}

const remove = (chipId: string) => (chips.value = chips.value.filter((chip) => chip.id !== chipId));
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="text-sm font-semibold">{{ label }}</label>
    <ul class="flex flex-wrap gap-2">
      <li
        v-for="chip in chips"
        :key="chip.id"
        :data-testid="chipTestId"
        class="inline-flex items-center gap-1 rounded-pill border border-line py-0.5 pl-3 text-sm"
      >
        <span :class="!isNamed(chip) && 'font-mono'">{{ nameOf(chip) }}</span>
        <button
          v-if="!lockedBy"
          type="button"
          class="inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-hover"
          :aria-label="$t('admin.ui.removeChip', { name: nameOf(chip) })"
          @click="remove(chip.id)"
        >
          <X aria-hidden="true" class="size-4" />
        </button>
      </li>
      <li v-if="chips.length === 0" class="text-sm text-muted">{{ $t('admin.ui.nobody') }}</li>
    </ul>
    <div class="relative">
      <input
        :id="id"
        v-model="typed"
        :class="ADMIN_INPUT_CLASS"
        :placeholder="placeholder"
        :disabled="isChipsFull || Boolean(lockedBy)"
        :aria-invalid="lookupError || error ? 'true' : undefined"
        :aria-describedby="describedBy"
        :role="suggest ? 'combobox' : undefined"
        :aria-expanded="suggest ? suggestions.options.value.length > 0 : undefined"
        :aria-controls="suggest ? listboxId : undefined"
        :aria-activedescendant="activeOptionId"
        aria-autocomplete="list"
        autocomplete="off"
        @keydown.enter.prevent="onEnter"
        @keydown.down.prevent="suggestions.move(1)"
        @keydown.up.prevent="suggestions.move(-1)"
        @keydown.esc="suggestions.close"
        @blur="suggestions.close"
      />
      <ul
        v-if="suggest"
        v-show="suggestions.options.value.length > 0"
        :id="listboxId"
        role="listbox"
        :aria-label="label"
        class="absolute top-full right-0 left-0 z-10 mt-1 max-h-72 overflow-y-auto rounded-row border border-line bg-surface-solid p-1 shadow-lg"
      >
        <li
          v-for="(chip, index) in suggestions.options.value"
          :id="optionId(index)"
          :key="chip.id"
          role="option"
          :aria-selected="index === suggestions.activeIndex.value"
          class="flex min-h-11 cursor-pointer items-center rounded-row px-3 text-sm aria-selected:bg-accent-soft aria-selected:text-accent-soft-text hover:bg-surface-hover"
          @mousedown.prevent
          @click="pick(chip)"
        >
          {{ nameOf(chip) }}
        </li>
      </ul>
    </div>
    <p v-if="lookupError || error" :id="`${id}-error`" class="text-sm text-negative">
      {{ lookupError || error }}
    </p>
    <p v-if="isChipsFull" :id="`${id}-full`" class="text-xs text-muted">
      {{ $t('admin.ui.maxReached', { max }) }}
    </p>
    <p v-if="lockedBy" :id="`${id}-locked`" class="text-xs text-muted">
      {{ needsPermissionText(lockedBy) }}
    </p>
  </div>
</template>
