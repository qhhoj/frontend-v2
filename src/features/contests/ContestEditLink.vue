<script setup lang="ts">
import { Pencil } from 'lucide-vue-next';
import type { ContestListItem } from '@/api/types/contests';
import IconButton from '@/components/ui/IconButton.vue';
import { adminRouteName } from '@/features/admin/admin-screens';

/** A pencil to the contest's editor, only on a contest the viewer may edit (the list's `editor` block is set). */
defineProps<{ contest: ContestListItem }>();
</script>

<template>
  <IconButton
    v-if="contest.editor"
    size="sm"
    data-testid="contest-edit"
    :label="$t('contests.list.edit', { name: contest.name })"
    :to="{ name: adminRouteName('contestGeneral'), params: { key: contest.key } }"
  >
    <Pencil class="size-4" :stroke-width="1.75" />
  </IconButton>
</template>
