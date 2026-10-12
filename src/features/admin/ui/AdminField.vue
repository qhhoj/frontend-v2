<script setup lang="ts">
import FormField from '@/components/ui/FormField.vue';

/**
 * `FormField` with the admin forms' 12 px hint and 14 px error. The input goes in the slot, which gets `id`, `describedBy`
 * and `invalid`; `required` adds a star and a hidden "bắt buộc".
 */
const props = defineProps<{
  label: string;
  hint?: string;
  error?: string;
  inputId?: string;
  required?: boolean;
}>();
</script>

<template>
  <FormField v-bind="props" scale="admin">
    <template #default="control"><slot v-bind="control" /></template>
  </FormField>
</template>
