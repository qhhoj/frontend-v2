<script setup lang="ts">
import { useId } from 'vue';

const model = defineModel<boolean>({ required: true });
const props = defineProps<{ label: string; description?: string; lockedBy?: string }>();
const labelId = useId();
const toggle = () => {
  if (!props.lockedBy) model.value = !model.value;
};
</script>

<template>
  <div class="flex items-start gap-3">
    <button
      type="button"
      role="switch"
      :aria-checked="model"
      :aria-disabled="lockedBy ? 'true' : undefined"
      :aria-labelledby="labelId"
      :aria-describedby="lockedBy ? `${labelId}-locked` : undefined"
      class="relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-pill border border-line-strong bg-surface-solid aria-checked:bg-gradient-accent"
      @click="toggle"
    >
      <span
        aria-hidden="true"
        class="ml-1 size-5 rounded-full bg-content transition-transform"
        :class="model && 'translate-x-5 bg-on-accent'"
      />
    </button>
    <div class="flex flex-col">
      <span :id="labelId" class="font-semibold">{{ label }}</span>
      <span v-if="description" class="text-sm text-muted">{{ description }}</span>
      <span v-if="lockedBy" :id="`${labelId}-locked`" class="text-xs text-muted">
        {{ $t('admin.ui.needsPermission', { permission: lockedBy }) }}
      </span>
    </div>
  </div>
</template>
