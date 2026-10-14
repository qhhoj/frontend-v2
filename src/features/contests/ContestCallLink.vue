<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';

defineProps<{ contestKey: string; contestName: string; labelKey: string; isPrimary: boolean }>();
</script>

<template>
  <AppButton
    :to="{ name: 'contest', params: { key: contestKey } }"
    :tone="isPrimary ? 'primary' : 'secondary'"
    class="min-w-52 justify-center whitespace-nowrap"
    >{{ $t(labelKey) }}<span class="sr-only">: {{ contestName }}</span></AppButton
  >
</template>
