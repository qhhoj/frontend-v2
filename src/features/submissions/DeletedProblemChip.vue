<script setup lang="ts">
import Chip from '@/components/ui/Chip.vue';

/** The "Đã xóa" tag beside a deleted problem's name in submission rows. */
</script>

<template>
  <Chip class="ml-2">{{ $t('deletedProblem.chip') }}</Chip>
</template>
