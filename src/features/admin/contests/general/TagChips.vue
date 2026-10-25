<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import { X } from 'lucide-vue-next';
import { INPUT } from '../../ui/controls';
import { needsPermissionText } from '../../ui/permission-text';

/** Free-text chips (tags, judge names): Enter adds, a repeat is ignored, the list is capped at `max`. */
const tags = defineModel<string[]>({ required: true });
const props = defineProps<{
  label: string;
  placeholder?: string;
  max?: number;
  error?: string;
  lockedBy?: string;
}>();
const id = useId();
const typed = ref('');
const isFull = computed(() => props.max !== undefined && tags.value.length >= props.max);

function add() {
  const tag = typed.value.trim();
  if (!tag || isFull.value || props.lockedBy) return;
  if (!tags.value.includes(tag)) tags.value = [...tags.value, tag];
  typed.value = '';
}

const remove = (tag: string) => (tags.value = tags.value.filter((item) => item !== tag));
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="text-sm font-semibold">{{ label }}</label>
    <ul v-if="tags.length" class="m-0 flex list-none flex-wrap gap-1.5 p-0">
      <li
        v-for="tag in tags"
        :key="tag"
        class="inline-flex min-h-[var(--qa-chip,1.5rem)] items-center gap-0.5 rounded-pill border border-line-strong bg-surface-solid pl-2.5 text-caption leading-4 font-semibold"
      >
        <span>{{ tag }}</span>
        <button
          v-if="!lockedBy"
          type="button"
          class="inline-flex size-6 items-center justify-center rounded-full text-muted hover:bg-surface-hover hover:text-content touch:size-9"
          :aria-label="$t('admin.ui.removeChip', { name: tag })"
          @click="remove(tag)"
        >
          <X aria-hidden="true" class="size-3.5" :stroke-width="1.75" />
        </button>
      </li>
    </ul>
    <input
      :id="id"
      v-model="typed"
      :class="INPUT"
      :placeholder="placeholder"
      :disabled="isFull || Boolean(lockedBy)"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? `${id}-error` : undefined"
      autocomplete="off"
      @keydown.enter.prevent="add"
    />
    <p v-if="error" :id="`${id}-error`" class="text-sm text-negative">{{ error }}</p>
    <p v-if="lockedBy" class="text-caption leading-4 text-muted">
      {{ needsPermissionText(lockedBy) }}
    </p>
  </div>
</template>
