<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';

/** The sticky bar while rows are ticked; the count is announced politely when it changes. */
defineProps<{ count: number; isPending: boolean }>();
const emit = defineEmits<{ archive: []; unarchive: []; tag: []; clear: [] }>();
</script>

<template>
  <div
    role="region"
    :aria-label="$t('orgProblems.bulk.label')"
    data-testid="org-bulk-bar"
    class="sticky bottom-3 z-10 flex flex-wrap items-center gap-2 rounded-row border border-line-strong bg-surface-solid p-3"
  >
    <p role="status" class="mr-auto font-semibold">
      {{ $t('orgProblems.bulk.selected', { count }, count) }}
    </p>
    <AppButton :disabled="isPending" @click="emit('tag')">
      {{ $t('orgProblems.bulk.tag') }}
    </AppButton>
    <AppButton :disabled="isPending" @click="emit('archive')">
      {{ $t('orgProblems.bulk.archive') }}
    </AppButton>
    <AppButton :disabled="isPending" @click="emit('unarchive')">
      {{ $t('orgProblems.bulk.unarchive') }}
    </AppButton>
    <AppButton tone="ghost" @click="emit('clear')">{{ $t('common.clearSelection') }}</AppButton>
  </div>
</template>
