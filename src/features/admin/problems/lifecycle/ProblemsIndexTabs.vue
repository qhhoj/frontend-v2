<script setup lang="ts">
import { usePermissions } from '@/stores/use-permissions';
import AdminTabs from '../../ui/AdminTabs.vue';
import { routeTabs } from '../../ui/admin-tabs';

/** "Tất cả bài" / "Đã xóa" above both problem lists; only `judge.delete_problem` holders can open the second. */
const TABS = routeTabs([
  { routeName: 'admin-problems', labelKey: 'admin.lifecycle.tabs.all' },
  { routeName: 'admin-problemsDeleted', labelKey: 'admin.lifecycle.tabs.deleted' },
]);
const { can } = usePermissions();
</script>

<template>
  <AdminTabs
    v-if="can('judge.delete_problem')"
    :tabs="TABS"
    :label="$t('admin.lifecycle.tabs.label')"
  />
</template>
