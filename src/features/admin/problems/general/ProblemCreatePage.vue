<script setup lang="ts">
import { computed } from 'vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { usePermissions } from '@/stores/use-permissions';
import CreatePageShell from '../../creation/CreatePageShell.vue';
import { useCreationScope } from '../../creation/creation-scope';
import { useProblemEditingMetaQuery } from '../problem-editing.queries';
import ProblemCreateForm from './ProblemCreateForm.vue';

const { can } = usePermissions();
const { scope } = useCreationScope('problem');
/** A viewer who can only suggest is told so; everyone else is told what the form asks. */
const leadKey = computed(() =>
  can('judge.add_problem') || scope.value.organizations
    ? 'admin.problems.general.create.lead'
    : 'admin.problems.general.create.leadSuggest',
);
const meta = useProblemEditingMetaQuery();
const retry = () => void meta.refetch();
</script>

<template>
  <CreatePageShell :title="$t('admin.problems.general.create.title')" :lead="$t(leadKey)">
    <QueryState :loading="meta.isPending.value" :error="meta.error.value" @retry="retry">
      <template #skeleton>
        <SkeletonBlock data-skeleton-region="problem-create" class="h-64 rounded-row" />
      </template>
      <ProblemCreateForm v-if="meta.data.value" :meta="meta.data.value" />
    </QueryState>
  </CreatePageShell>
</template>
