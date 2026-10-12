<script setup lang="ts">
import Notice from '@/components/ui/Notice.vue';

type StatusKind = 'done' | 'refused' | 'queued' | 'security';
/** One result line: `done` and `queued` are polite status, `refused` an alert, `security` standing info announced politely. */
const TONES = { done: 'success', refused: 'danger', queued: 'info', security: 'info' } as const;
/** Always supplied: a notice's `info` tone has no role of its own. */
const ROLES = { done: 'status', refused: 'alert', queued: 'status', security: 'status' } as const;
defineProps<{ kind: StatusKind; text: string }>();
</script>

<template>
  <Notice :tone="TONES[kind]" :role="ROLES[kind]">
    {{ text }}
    <template #action><slot /></template>
  </Notice>
</template>
