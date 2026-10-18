<script setup lang="ts">
import type { OrganizationProblem } from '@/api/types/organization-problems';

/** The two row actions of an administrator, as two buttons for the caller's wrapper. A label never wraps. */
defineProps<{ row: OrganizationProblem; isBusy: boolean }>();
const emit = defineEmits<{ 'edit-tags': []; 'toggle-archive': [] }>();
const ACTION =
  'inline-flex min-h-11 items-center rounded-pill border border-line px-3 text-sm font-semibold whitespace-nowrap hover:bg-surface-hover aria-disabled:cursor-progress aria-disabled:text-muted';
</script>

<template>
  <button
    type="button"
    :class="ACTION"
    :aria-label="$t('orgProblems.editTagsLabel', { code: row.code })"
    @click="emit('edit-tags')"
  >
    {{ $t('orgProblems.editTags') }}
  </button>
  <button
    type="button"
    :class="ACTION"
    :aria-disabled="isBusy ? 'true' : undefined"
    :aria-label="
      $t(row.isArchived ? 'orgProblems.unarchiveRowLabel' : 'orgProblems.archiveRowLabel', {
        code: row.code,
      })
    "
    @click="emit('toggle-archive')"
  >
    {{ $t(row.isArchived ? 'orgProblems.unarchiveRow' : 'orgProblems.archiveRow') }}
  </button>
</template>
