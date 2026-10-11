<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowUpRight, Copy, Globe, Lightbulb, Lock } from 'lucide-vue-next';
import type { EditableProblem } from '@/api/types/problem-editing';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { usePermissions } from '@/stores/use-permissions';
import AdminBit from '../shell/AdminBit.vue';
import AdminChip from '../ui/AdminChip.vue';
import type { ChipTone } from '../ui/AdminChip.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminTabs from '../ui/AdminTabs.vue';
import ProblemSetupChecklist from './ProblemSetupChecklist.vue';
import { routeTabs } from '../ui/admin-tabs';
import { buttonClass } from '../ui/controls';
import { isNotFound } from '../ui/admin-errors';
import ProblemCloneDialog from './general/ProblemCloneDialog.vue';
import { useEditableProblemQuery, useProblemEditingMetaQuery } from './problem-editing.queries';
import { PROBLEM_TABS, problemTabComponent, problemTabOf } from './problem-tabs';

const route = useRoute();
const { can } = usePermissions();
const code = computed(() => String(route.params.code));
const problem = useEditableProblemQuery(code);
const meta = useProblemEditingMetaQuery();
const tab = computed(() => problemTabOf(route.name));
const body = computed(() => problemTabComponent(tab.value.id));
const isMissing = computed(() => isNotFound(problem.error.value));
const canEdit = computed(() => Boolean(problem.data.value?.canEdit && problem.data.value.editor));
const canClone = computed(() => canEdit.value && can('judge.clone_problem'));
const isCloneOpen = ref(false);

/** The header's status chip: public, a suggestion still under review, or private. */
function statusOf(detail: EditableProblem): { key: string; tone: ChipTone; icon: typeof Globe } {
  if (detail.isPublic) return { key: 'public', tone: 'positive', icon: Globe };
  if (detail.editor?.suggester) return { key: 'suggested', tone: 'caution', icon: Lightbulb };
  return { key: 'private', tone: 'neutral', icon: Lock };
}
const status = computed(() => (problem.data.value ? statusOf(problem.data.value) : null));

/** The tabs stick to the top: a focused field or a section jumped to lands below them, never under them. */
const root = document.documentElement;
const previousPaddingTop = root.style.scrollPaddingTop;
onMounted(() => (root.style.scrollPaddingTop = '3.5rem'));
onBeforeUnmount(() => (root.style.scrollPaddingTop = previousPaddingTop));

const retry = () => {
  void problem.refetch();
  void meta.refetch();
};
function openClone(close: () => void) {
  close();
  isCloneOpen.value = true;
}
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
          data-skeleton-region="problem-editor-header"
          class="h-[10.25rem] w-full rounded-row sm:h-[4.75rem]"
        />
        <SkeletonBlock data-skeleton-region="problem-editor-body" class="h-96 w-full rounded-row" />
      </template>
      <template v-if="problem.data.value && meta.data.value">
        <AdminPageHeader
          :trail="[{ label: code, mono: true }]"
          :title="problem.data.value.name"
          :lead="$t(tab.leadKey)"
        >
          <template #meta>
            <AdminChip
              ><span class="font-mono">{{ code }}</span></AdminChip
            >
            <AdminChip v-if="status" :tone="status.tone" :icon="status.icon">
              {{ $t(`admin.problems.header.${status.key}`) }}
            </AdminChip>
          </template>
          <template #actions>
            <RouterLink :to="{ name: 'problem', params: { code } }" :class="buttonClass()">
              {{ $t('admin.problems.view') }}
              <ArrowUpRight aria-hidden="true" class="size-4" :stroke-width="1.75" />
            </RouterLink>
          </template>
          <template v-if="canClone" #overflow="{ close }">
            <button
              type="button"
              class="flex min-h-(--qa-control) items-center gap-2 rounded-cell px-3 text-left text-sm hover:bg-surface-hover"
              @click="openClone(close)"
            >
              <Copy aria-hidden="true" class="size-4 text-muted" :stroke-width="1.75" />
              {{ $t('admin.problems.clone.open') }}
            </button>
          </template>
        </AdminPageHeader>
        <ProblemSetupChecklist v-if="canEdit" :problem="problem.data.value" />
        <AdminTabs
          sticky
          :tabs="routeTabs(PROBLEM_TABS, { code })"
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
        <ProblemCloneDialog v-if="canClone" v-model:visible="isCloneOpen" :code="code" />
      </template>
    </QueryState>
  </div>
</template>
