<script setup lang="ts">
import type { EditableContest } from '@/api/types/contest-editing';

/** Stub: Task 9 replaces this file with the ghost tab. */
defineProps<{ contest: EditableContest }>();
</script>

<template>
  <p>{{ $t('admin.ghosts.title') }}</p>
</template>
