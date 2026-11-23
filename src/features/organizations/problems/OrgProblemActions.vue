<script setup lang="ts">
import type { OrganizationProblem } from '@/api/types/organization-problems';
import AppButton from '@/components/ui/AppButton.vue';

/** The two row actions of an administrator, as two buttons for the caller's wrapper. A label never wraps. */
defineProps<{ row: OrganizationProblem; isBusy: boolean }>();
const emit = defineEmits<{ 'edit-tags': []; 'toggle-archive': [] }>();
</script>

<template>
  <AppButton
    size="sm"
    :aria-label="$t('orgProblems.editTagsLabel', { code: row.code })"
    @click="emit('edit-tags')"
  >
    {{ $t('orgProblems.editTags') }}
  </AppButton>
  <AppButton
    size="sm"
    :loading="isBusy"
    :aria-label="
      $t(row.isArchived ? 'orgProblems.unarchiveRowLabel' : 'orgProblems.archiveRowLabel', {
        code: row.code,
      })
    "
    @click="emit('toggle-archive')"
  >
    {{ $t(row.isArchived ? 'orgProblems.unarchiveRow' : 'orgProblems.archiveRow') }}
  </AppButton>
</template>
