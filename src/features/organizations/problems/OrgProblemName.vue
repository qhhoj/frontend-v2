<script setup lang="ts">
import EditLink from '@/components/EditLink.vue';
import type { OrganizationProblem } from '@/api/types/organization-problems';
import { adminRouteName } from '@/features/admin/admin-screens';

/** A problem's name as a link, then the pencil to its editor when the viewer may edit it and the archived chip. */
defineProps<{ row: OrganizationProblem }>();
</script>

<template>
  <RouterLink
    :to="{ name: 'problem', params: { code: row.code } }"
    class="font-semibold text-content hover:underline"
    >{{ row.name }}</RouterLink
  >
  <EditLink
    v-if="row.canEdit"
    data-testid="problem-edit"
    class="ml-1 align-middle"
    :label="$t('orgProblems.editProblem', { code: row.code })"
    :to="{ name: adminRouteName('problemGeneral'), params: { code: row.code } }"
  />
  <span
    v-if="row.isArchived"
    class="ml-2 rounded-pill bg-surface-hover px-2 py-0.5 text-xs font-semibold text-content"
    >{{ $t('orgProblems.archivedChip') }}</span
  >
</template>
