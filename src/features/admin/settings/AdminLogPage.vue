<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import AuditFeed from '../audit/AuditFeed.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminTabs from '../ui/AdminTabs.vue';
import type { AdminTab } from '../ui/AdminTabs.vue';
import { adminRouteName } from '../admin-screens';
import SettingsLogPanel from './SettingsLogPanel.vue';

/** Two views: every recorded change (default), and one setting's history with restore (`?view=settings`, or any `?key=`). */
const route = useRoute();
const { t } = useI18n();
const view = computed(() =>
  route.query.view === 'settings' || typeof route.query.key === 'string' ? 'settings' : 'all',
);
const LOG = adminRouteName('log');
const tabs: AdminTab[] = [
  { key: 'all', labelKey: 'admin.audit.tabs.all', to: { name: LOG } },
  {
    key: 'settings',
    labelKey: 'admin.audit.tabs.settings',
    to: { name: LOG, query: { view: 'settings' } },
  },
];
</script>

<template>
  <AdminPageHeader :title="t('admin.settings.log.title')" :lead="t('admin.audit.lead')" />
  <AdminTabs :tabs="tabs" :current="view" :label="t('admin.audit.tabs.label')" />
  <AuditFeed v-if="view === 'all'" />
  <SettingsLogPanel v-else />
</template>
