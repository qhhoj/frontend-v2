<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import Notice from '@/components/ui/Notice.vue';

/** The API sends the judge's message only to the problem's editors (it can quote jury data); everyone else gets null and sees only the neutral line. */
defineProps<{ message: string | null }>();
</script>

<template>
  <Card v-if="message" as="div" data-testid="internal-error" class="rounded-card p-4 sm:p-6">
    <Notice tone="warning">{{ $t('submission.internalError.notice') }}</Notice>
    <p class="mt-4 text-meta text-muted">{{ $t('submission.internalError.staffMessage') }}</p>
    <pre
      data-testid="internal-error-message"
      class="mt-1.5 max-h-96 overflow-auto rounded-cell bg-surface-strong p-4 font-mono text-meta leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]"
      >{{ message }}</pre>
  </Card>
  <Notice v-else tone="warning" data-testid="internal-error">{{
    $t('submission.internalError.notice')
  }}</Notice>
</template>
