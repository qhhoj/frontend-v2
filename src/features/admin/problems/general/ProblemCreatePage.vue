<script setup lang="ts">
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AdminPageHeader from '../../ui/AdminPageHeader.vue';
import { useProblemEditingMetaQuery } from '../problem-editing.queries';
import ProblemCreateForm from './ProblemCreateForm.vue';

const meta = useProblemEditingMetaQuery();
const retry = () => void meta.refetch();
</script>

<template>
  <div class="flex flex-col gap-5 px-4 py-6 sm:px-8">
    <AdminPageHeader
      :crumbs="[
        { label: $t('admin.shell.screens.problems'), to: { name: 'admin-problems' } },
        { label: $t('admin.problems.general.create.crumb') },
      ]"
      :title="$t('admin.problems.general.create.title')"
    />
    <QueryState :loading="meta.isPending.value" :error="meta.error.value" @retry="retry">
      <template #skeleton>
        <SkeletonBlock data-skeleton-region="problem-create" class="h-96 w-full rounded-panel" />
      </template>
      <ProblemCreateForm v-if="meta.data.value" :meta="meta.data.value" />
    </QueryState>
  </div>
</template>
