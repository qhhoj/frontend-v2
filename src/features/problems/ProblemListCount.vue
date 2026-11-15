<script setup lang="ts">
import CreateShortcut from '@/features/admin/creation/CreateShortcut.vue';

/** The list's count ("214 đã giải · 1.483 bài") and the staff's "Tạo bài tập": in the top bar on a computer, in the page on a phone. */
defineProps<{ text: string }>();
</script>

<template>
  <div class="flex items-center justify-between gap-3">
    <p data-testid="problems-count" class="font-mono text-meta text-muted tabular-nums">
      {{ text }}
    </p>
    <CreateShortcut kind="problem" />
  </div>
</template>
