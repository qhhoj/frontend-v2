<script setup lang="ts">
import { Plus } from 'lucide-vue-next';
import { useSessionStore } from '@/stores/session.store';
import { usePermissions } from '@/stores/use-permissions';
import { canUseAdmin } from '../admin-access';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import { buttonClass } from '../ui/controls';
import ProblemSearchList from '../search/ProblemSearchList.vue';
import { ADMIN_SCREENS } from '../admin-screens';
import ProblemImportMenu from './ProblemImportMenu.vue';
import ProblemsIndexTabs from './lifecycle/ProblemsIndexTabs.vue';

/** `/admin/problems`: header (create, import), the list tabs, then the filter bar and table in one card. */
const { canAny } = usePermissions();
const session = useSessionStore();
</script>

<template>
  <div class="flex flex-col gap-4">
    <AdminPageHeader :title="$t('admin.shell.screens.problems')">
      <template #actions>
        <ProblemImportMenu v-if="canUseAdmin(session.user, ADMIN_SCREENS.problemImport)" />
        <RouterLink
          v-if="canAny(ADMIN_SCREENS.problemNew.permission)"
          :to="{ name: 'admin-problemNew' }"
          :class="buttonClass('primary')"
        >
          <Plus aria-hidden="true" class="size-4" :stroke-width="1.75" />
          {{ $t('admin.shell.dashboard.actions.problemNew') }}
        </RouterLink>
      </template>
    </AdminPageHeader>
    <ProblemsIndexTabs />
    <ProblemSearchList />
  </div>
</template>
