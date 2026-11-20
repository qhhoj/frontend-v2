<script setup lang="ts">
import { Plus } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Modal from '@/components/ui/Modal.vue';
import { useSessionStore } from '@/stores/session.store';
import { usePermissions } from '@/stores/use-permissions';
import { canUseAdmin } from '../admin-access';
import { ADMIN_SCREENS } from '../admin-screens';
import OwnerCreditLine from '../creation/OwnerCreditLine.vue';
import { useCreationOwnersQuery } from '../creation/creation-owners';
import ProblemSearchList from '../search/ProblemSearchList.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import ProblemCreateForm from './general/ProblemCreateForm.vue';
import { EDIT_ALL_PROBLEM } from './general/field-lock';
import ProblemImportMenu from './ProblemImportMenu.vue';
import ProblemsIndexTabs from './lifecycle/ProblemsIndexTabs.vue';
import { useProblemEditingMetaQuery } from './problem-editing.queries';

/**
 * `/admin/problems`, "Bài tập của tôi": the problems the account may edit. The header carries the title, the credits of
 * the viewer's organization when there is exactly one (with several, the create form shows the chosen one's), and the
 * page buttons: import, then the one primary "Tạo bài tập", which opens the three-field form in a dialog. Below: the
 * list tabs (all, deleted) for whoever may delete, then the toolbar and the table.
 */
const { can } = usePermissions();
const session = useSessionStore();
const canCreate = computed(() => canUseAdmin(session.user, ADMIN_SCREENS.problemNew));
/** An account that edits every problem sees the whole site here, so the page is not called "mine". */
const titleKey = computed(() =>
  can(EDIT_ALL_PROBLEM) ? 'admin.shell.screens.problems' : 'admin.problemList.titleOwn',
);
const owners = useCreationOwnersQuery('problem');
const onlyOwner = computed(() => {
  const list = owners.data.value ?? [];
  return list.length === 1 ? list[0]! : null;
});
const isCreateOpen = ref(false);
const meta = useProblemEditingMetaQuery();
</script>

<template>
  <div class="flex flex-col gap-4">
    <AdminPageHeader :title="$t(titleKey)">
      <template v-if="onlyOwner" #meta><OwnerCreditLine :owner="onlyOwner" /></template>
      <template #actions>
        <ProblemImportMenu v-if="canUseAdmin(session.user, ADMIN_SCREENS.problemImport)" />
        <AppButton
          v-if="canCreate"
          tone="primary"
          data-testid="create-problem"
          @click="isCreateOpen = true"
        >
          <template #icon><Plus aria-hidden="true" /></template>
          {{ $t('create.problem') }}
        </AppButton>
      </template>
    </AdminPageHeader>
    <ProblemsIndexTabs />
    <ProblemSearchList :can-create="canCreate" @create="isCreateOpen = true" />
    <Modal v-model:visible="isCreateOpen" size="sm" :title="$t('create.problem')">
      <QueryState :loading="meta.isPending.value" :error="meta.error.value" @retry="meta.refetch()">
        <template #skeleton>
          <SkeletonBlock data-skeleton-region="problem-create" class="h-64 w-full rounded-row" />
        </template>
        <ProblemCreateForm
          v-if="meta.data.value"
          :meta="meta.data.value"
          cancellable
          @cancel="isCreateOpen = false"
        />
      </QueryState>
    </Modal>
  </div>
</template>
