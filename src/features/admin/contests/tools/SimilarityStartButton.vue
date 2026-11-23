<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';

/** "Chạy kiểm tra trùng lặp" for one contest: the same button whether runs exist (above the list) or not (the empty state's action). */
defineProps<{ isPending: boolean; isBlocked: boolean }>();
defineEmits<{ start: [] }>();
</script>

<template>
  <AppButton
    data-testid="similarity-start"
    :loading="isPending"
    :disabled="isBlocked"
    :disabled-reason="$t('admin.contests.workbench.tools.similarity.running')"
    @click="$emit('start')"
  >
    {{ $t('admin.similarity.scope.start') }}
  </AppButton>
</template>
