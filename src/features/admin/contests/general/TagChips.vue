<script setup lang="ts">
import Chip from '@/components/ui/Chip.vue';
import { computed, ref, useId } from 'vue';
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
      <li v-for="tag in tags" :key="tag">
        <Chip
          v-if="!lockedBy"
          removable
          :remove-label="$t('admin.ui.removeChip', { name: tag })"
          @remove="remove(tag)"
          >{{ tag }}</Chip
        >
        <Chip v-else strong>{{ tag }}</Chip>
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
