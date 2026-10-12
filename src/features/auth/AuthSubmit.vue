<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';

/** The board's submit button. While `pending` it keeps focus and ignores clicks; `useAuthAction` also ignores an extra submit. */
defineProps<{ pending?: boolean }>();
</script>

<template>
  <AppButton tone="primary" type="submit" block :loading="pending"><slot /></AppButton>
</template>
