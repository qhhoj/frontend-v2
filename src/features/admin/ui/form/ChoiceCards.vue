<script setup lang="ts" generic="T extends string">
import KitChoiceCards from '@/components/ui/ChoiceCards.vue';

/** Kept for the admin call sites; the part is `components/ui/ChoiceCards.vue`. */
const model = defineModel<T>({ required: true });
defineProps<{
  legend: string;
  name: string;
  options: { value: T; label: string; description: string }[];
}>();
</script>

<template>
  <KitChoiceCards v-model="model" :legend="legend" :name="name" :options="options" />
</template>
