<script setup lang="ts">
import { computed } from 'vue';
import { adminRouteName } from '../admin-screens';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminTabs from '../ui/AdminTabs.vue';
import type { AdminTab } from '../ui/AdminTabs.vue';
import { useAdminCounts } from '../shell/overview/admin-overview.queries';

/**
 * One "Bình luận" page with three tabs (P-35): the reports queue first, every comment, and the locked pages. Each tab keeps
 * its own route, so links and the back button still work; the open reports count rides on the first tab like the nav badge.
 */
defineProps<{ lead: string }>();
const { openReports } = useAdminCounts();
const tabs = computed<AdminTab[]>(() => [
  {
    key: adminRouteName('commentReports'),
    labelKey: 'admin.comments.section.reports',
    to: { name: adminRouteName('commentReports') },
    count: openReports.value || null,
  },
  {
    key: adminRouteName('comments'),
    labelKey: 'admin.comments.section.all',
    to: { name: adminRouteName('comments') },
  },
  {
    key: adminRouteName('commentLocks'),
    labelKey: 'admin.comments.section.locks',
    to: { name: adminRouteName('commentLocks') },
  },
]);
</script>

<template>
  <AdminPageHeader :title="$t('admin.comments.section.title')" :lead="lead" />
  <AdminTabs :tabs="tabs" :label="$t('admin.comments.section.tabsLabel')" />
</template>
