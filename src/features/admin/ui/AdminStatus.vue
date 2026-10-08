<script setup lang="ts">
import SettingsNotice from '@/features/account/settings/SettingsNotice.vue';
import { ADMIN_BIT_KINDS } from '../shell/admin-bit';

type StatusKind = 'done' | 'refused' | 'queued' | 'security';
/** One result line: `done` and `queued` are polite status, `refused` an alert, `security` standing info announced politely. */
const TONES = { done: 'success', refused: 'error', queued: 'info', security: 'info' } as const;
/**
 * Always supplied, never `undefined`: a notice's `info` tone has no role of its own, and a fallthrough attribute whose value is
 * `undefined` would also strip the role the notice sets for `success` and `error`.
 */
const ROLES = { done: 'status', refused: 'alert', queued: 'status', security: 'status' } as const;
defineProps<{ kind: StatusKind; text: string }>();
</script>

<template>
  <SettingsNotice :tone="TONES[kind]" :bit="ADMIN_BIT_KINDS[kind]" :role="ROLES[kind]">
    {{ text }}
    <template #action><slot /></template>
  </SettingsNotice>
</template>
