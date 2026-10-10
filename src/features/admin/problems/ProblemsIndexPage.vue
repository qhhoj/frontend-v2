<script setup lang="ts">
import { useRouter } from 'vue-router';
import { usePermissions } from '@/stores/use-permissions';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import ExactLookup from '../ui/ExactLookup.vue';
import ProblemSearchList from '../search/ProblemSearchList.vue';
import { ADMIN_BUTTON_CLASS, ADMIN_PRIMARY_CLASS } from '../ui/classes';
import { ADMIN_SCREENS } from '../admin-screens';
import ProblemsIndexTabs from './lifecycle/ProblemsIndexTabs.vue';

const router = useRouter();
const { canAny } = usePermissions();
const open = (code: string) => router.push({ name: 'admin-problemGeneral', params: { code } });
</script>

<template>
  <div class="flex flex-col gap-5">
    <AdminPageHeader
      :crumbs="[{ label: $t('admin.shell.groups.content') }]"
      :title="$t('admin.shell.screens.problems')"
      :lead="$t('admin.problems.indexLead')"
    >
      <template #actions>
        <RouterLink
          v-if="canAny(ADMIN_SCREENS.problemNew.permission)"
          :to="{ name: 'admin-problemNew' }"
          :class="ADMIN_PRIMARY_CLASS"
          >{{ $t('admin.shell.dashboard.actions.problemNew') }}</RouterLink
        >
        <RouterLink
          v-if="canAny(ADMIN_SCREENS.polygonImport.permission)"
          :to="{ name: 'admin-polygonImport' }"
          :class="ADMIN_BUTTON_CLASS"
          >{{ $t('admin.shell.dashboard.actions.polygonImport') }}</RouterLink
        >
        <RouterLink
          v-if="canAny(ADMIN_SCREENS.problemImport.permission)"
          :to="{ name: 'admin-problemImport' }"
          :class="ADMIN_BUTTON_CLASS"
          >{{ $t('admin.shell.dashboard.actions.problemImport') }}</RouterLink
        >
      </template>
    </AdminPageHeader>
    <ProblemsIndexTabs />
    <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
      <section class="glass rounded-panel p-5">
        <ExactLookup
          :label="$t('admin.problems.lookupLabel')"
          :submit-label="$t('admin.problems.lookupSubmit')"
          :hint="$t('admin.problems.lookupHint')"
          @open="open"
        />
      </section>
      <ProblemSearchList />
    </div>
  </div>
</template>
