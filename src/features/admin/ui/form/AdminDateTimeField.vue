<script setup lang="ts">
import DateTimeField from '@/components/ui/DateTimeField.vue';
import type { DateTimeFieldProps } from '@/components/ui/DateTimeField.props';

/** Kept for the admin call sites: the kit `DateTimeField` with the admin forms' 12 px hint. */
const model = defineModel<string | null>({ required: true });
/** `showNow` stays undefined when absent (a boolean prop would default to false and hide the button). */
withDefaults(defineProps<Omit<DateTimeFieldProps, 'scale'>>(), { showNow: undefined });
</script>

<template>
  <DateTimeField v-bind="$props" v-model="model" scale="admin" />
</template>
