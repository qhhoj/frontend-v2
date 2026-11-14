<script setup lang="ts">
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import type { MessageRef } from '@/lib/contest-time';

/** A virtual run or a windowed participation has a personal clock that starts on the request, so the viewer is asked once. */
defineProps<{ span: MessageRef; confirmLabel: string }>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ confirm: [] }>();
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="$t('contests.startNow.title')"
    :body="$t('contests.startNow.body', { span: $t(span.key, span.params, span.count ?? 1) })"
    :confirm-label="confirmLabel"
    :cancel-label="$t('contests.startNow.wait')"
    @confirm="emit('confirm')"
  />
</template>
