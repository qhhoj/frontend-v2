<script setup lang="ts">
import type { ContestListItem } from '@/api/types/contests';
import EditLink from '@/components/EditLink.vue';
import { adminRouteName } from '@/features/admin/admin-screens';

/** A pencil to the contest's editor, only on a contest the viewer may edit (the list's `editor` block is set). */
defineProps<{ contest: ContestListItem }>();
</script>

<template>
  <EditLink
    v-if="contest.editor"
    data-testid="contest-edit"
    :label="$t('contests.list.edit', { name: contest.name })"
    :to="{ name: adminRouteName('contestGeneral'), params: { key: contest.key } }"
  />
</template>
