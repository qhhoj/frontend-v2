<script setup lang="ts">
import { RouterLink } from 'vue-router';
import EmptyState from '@/components/EmptyState.vue';

/** The statement area of a problem that has no text and no PDF; editors get a link to where it is written. */
defineProps<{ code: string; canEdit: boolean }>();
</script>

<template>
  <EmptyState data-testid="no-statement">
    <span class="block font-display font-semibold text-content">{{
      $t('problem.noStatement.title')
    }}</span>
    <span class="mt-1 block text-sm">{{ $t('problem.noStatement.body') }}</span>
    <RouterLink
      v-if="canEdit"
      :to="{ name: 'admin-problemStatements', params: { code } }"
      data-testid="no-statement-edit"
      class="mt-3 inline-block rounded-pill border border-line-accent bg-accent-soft px-4 py-1.5 text-sm font-medium text-accent-soft-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      {{ $t('problem.noStatement.edit') }}
    </RouterLink>
  </EmptyState>
</template>
