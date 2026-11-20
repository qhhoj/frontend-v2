<script setup lang="ts">
import EditLink from '@/components/EditLink.vue';
import Chip from '@/components/ui/Chip.vue';
import type { OrganizationProblem } from '@/api/types/organization-problems';
import { adminRouteName } from '@/features/admin/admin-screens';

/** What follows a problem's name in the organization's list: the pencil to its editor when the viewer may edit it, and the archived tag. */
defineProps<{ row: OrganizationProblem }>();
</script>

<template>
  <EditLink
    v-if="row.canEdit"
    data-testid="problem-edit"
    class="relative shrink-0 self-center"
    :label="$t('orgProblems.editProblem', { code: row.code })"
    :to="{ name: adminRouteName('problemGeneral'), params: { code: row.code } }"
  />
  <Chip v-if="row.isArchived" size="sm" class="shrink-0 self-center">{{
    $t('orgProblems.archivedChip')
  }}</Chip>
</template>
