<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AdminBit from '../../shell/AdminBit.vue';
import { isNotFound } from '../../ui/admin-errors';
import { useEditableProblemQuery, useProblemEditingMetaQuery } from '../problem-editing.queries';
import ProblemWorkbench from './ProblemWorkbench.vue';

/**
 * The route of the problem workbench (every old tab address leads here): reads the problem and the form's catalogues, then
 * shows the workbench. The workbench is keyed by the problem's id, not its code: a rename keeps the page and its unsaved
 * edits; another problem starts clean.
 */
const route = useRoute();
const code = computed(() => String(route.params.code));
const problem = useEditableProblemQuery(code);
const meta = useProblemEditingMetaQuery();
const isMissing = computed(() => isNotFound(problem.error.value));
const canEdit = computed(() => Boolean(problem.data.value?.canEdit && problem.data.value.editor));
const retry = () => {
  void problem.refetch();
  void meta.refetch();
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <p v-if="isMissing" role="alert" class="flex items-center gap-3">
      <AdminBit placement="refused" />{{ $t('admin.problems.notFound', { code }) }}
    </p>
    <QueryState
      v-else
      :loading="problem.isPending.value || meta.isPending.value"
      :error="problem.error.value ?? meta.error.value"
      @retry="retry"
    >
      <template #skeleton>
        <SkeletonBlock
          data-skeleton-region="problem-workbench-plate"
          class="h-40 w-full rounded-row"
        />
        <SkeletonBlock
          data-skeleton-region="problem-workbench-body"
          class="h-96 w-full rounded-row"
        />
      </template>
      <template v-if="problem.data.value && meta.data.value">
        <p v-if="!canEdit" role="alert" class="flex items-center gap-3">
          <AdminBit placement="forbidden" />{{ $t('admin.problems.cannotEdit', { code }) }}
        </p>
        <ProblemWorkbench
          v-else
          :key="problem.data.value.id"
          :problem="problem.data.value"
          :meta="meta.data.value"
        />
      </template>
    </QueryState>
  </div>
</template>
