<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AdminBit from '../shell/AdminBit.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminTabs from '../ui/AdminTabs.vue';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import { useEditableProblemQuery, useProblemEditingMetaQuery } from './problem-editing.queries';
import { PROBLEM_TABS, problemTabComponent, problemTabOf } from './problem-tabs';
import { isNotFound } from '../ui/admin-errors';

const route = useRoute();
const code = computed(() => String(route.params.code));
const problem = useEditableProblemQuery(code);
const meta = useProblemEditingMetaQuery();
const tab = computed(() => problemTabOf(route.name));
const body = computed(() => problemTabComponent(tab.value.id));
const isMissing = computed(() => isNotFound(problem.error.value));
const canEdit = computed(() => Boolean(problem.data.value?.canEdit && problem.data.value.editor));

const retry = () => {
  void problem.refetch();
  void meta.refetch();
};
</script>

<template>
  <div class="flex flex-col gap-5">
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
          data-skeleton-region="problem-editor-header"
          class="h-[7.75rem] w-full rounded-panel sm:h-[4.75rem]"
        />
        <SkeletonBlock
          data-skeleton-region="problem-editor-body"
          class="h-96 w-full rounded-panel"
        />
      </template>
      <template v-if="problem.data.value && meta.data.value">
        <AdminPageHeader
          :crumbs="[
            { label: $t('admin.shell.screens.problems'), to: { name: 'admin-problems' } },
            { label: code },
          ]"
          :title="problem.data.value.name"
          :lead="$t(tab.leadKey)"
        >
          <template #actions>
            <RouterLink :to="{ name: 'problem', params: { code } }" :class="ADMIN_BUTTON_CLASS">{{
              $t('admin.problems.view')
            }}</RouterLink>
          </template>
        </AdminPageHeader>
        <AdminTabs
          :tabs="[...PROBLEM_TABS]"
          :params="{ code }"
          :label="$t('admin.problems.tabsLabel')"
        />
        <p v-if="!canEdit" role="alert" class="flex items-center gap-3">
          <AdminBit placement="forbidden" />{{ $t('admin.problems.cannotEdit', { code }) }}
        </p>
        <component
          :is="body"
          v-else-if="body"
          :problem="problem.data.value"
          :meta="meta.data.value"
        />
        <p v-else class="text-muted">{{ $t('admin.shell.placeholder') }}</p>
      </template>
    </QueryState>
  </div>
</template>
