<script setup lang="ts">
import EmptyState from '@/components/EmptyState.vue';
import AppButton from '@/components/ui/AppButton.vue';

/** The statement area of a problem that has no text and no PDF; editors get a link to where it is written. */
defineProps<{ code: string; canEdit: boolean }>();
</script>

<template>
  <EmptyState data-testid="no-statement">
    <span class="block font-display font-semibold text-content">{{
      $t('problem.noStatement.title')
    }}</span>
    <span class="mt-1 block text-sm">{{ $t('problem.noStatement.body') }}</span>
    <AppButton
      v-if="canEdit"
      :to="{ name: 'admin-problemStatements', params: { code } }"
      data-testid="no-statement-edit"
      size="sm"
      class="mt-3"
    >
      {{ $t('problem.noStatement.edit') }}
    </AppButton>
  </EmptyState>
</template>
