<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import { X } from 'lucide-vue-next';
import { ADMIN_INPUT_CLASS } from '../../ui/classes';

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
    <ul class="flex flex-wrap gap-2">
      <li
        v-for="tag in tags"
        :key="tag"
        class="inline-flex items-center gap-1 rounded-pill border border-line py-0.5 pl-3 text-sm"
      >
        <span>{{ tag }}</span>
        <button
          v-if="!lockedBy"
          type="button"
          class="inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-hover"
          :aria-label="$t('admin.ui.removeChip', { name: tag })"
          @click="remove(tag)"
        >
          <X aria-hidden="true" class="size-4" />
        </button>
      </li>
      <li v-if="tags.length === 0" class="text-sm text-muted">{{ $t('admin.ui.nobody') }}</li>
    </ul>
    <input
      :id="id"
      v-model="typed"
      :class="ADMIN_INPUT_CLASS"
      :placeholder="placeholder"
      :disabled="isFull || Boolean(lockedBy)"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? `${id}-error` : undefined"
      autocomplete="off"
      @keydown.enter.prevent="add"
    />
    <p v-if="error" :id="`${id}-error`" class="text-sm text-negative">{{ error }}</p>
    <p v-if="lockedBy" class="text-xs text-muted">
      {{ $t('admin.ui.needsPermission', { permission: lockedBy }) }}
    </p>
  </div>
</template>
