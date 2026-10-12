<script setup lang="ts" generic="Value extends string | number">
import SegmentedControl from '@/components/ui/SegmentedControl.vue';

defineProps<{
  label: string;
  options: ReadonlyArray<{ value: Value; label: string }>;
  selected: Value | null;
  disabled?: boolean;
}>();
defineEmits<{ pick: [value: Value] }>();
</script>

<template>
  <SegmentedControl
    :label="label"
    :options="options"
    :model-value="selected"
    :disabled="disabled"
    @update:model-value="(value) => $emit('pick', value as Value)"
  />
</template>
