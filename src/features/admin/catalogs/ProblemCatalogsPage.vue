<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { usePermissions } from '@/stores/use-permissions';
import AdminBit from '../shell/AdminBit.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminTabs from '../ui/AdminTabs.vue';
import type { AdminTab } from '../ui/AdminTabs.vue';
import LicenseCatalogPanel from './LicenseCatalogPanel.vue';
import TaxonCatalogPanel from './TaxonCatalogPanel.vue';

/** One tab per catalog the viewer may change; the tab lives in `?tab=` so a link opens it. */
const TABS = [
  { id: 'problem-types', permission: 'judge.change_problemtype' },
  { id: 'problem-groups', permission: 'judge.change_problemgroup' },
  { id: 'licenses', permission: 'judge.change_license' },
] as const;
type TabId = (typeof TABS)[number]['id'];

const route = useRoute();
const { can } = usePermissions();
const tabs = computed(() => TABS.filter((tab) => can(tab.permission)));
const active = computed<TabId | undefined>(
  () => tabs.value.find((tab) => tab.id === route.query.tab)?.id ?? tabs.value[0]?.id,
);
const tabItems = computed<AdminTab[]>(() =>
  tabs.value.map((tab) => ({
    key: tab.id,
    labelKey: `admin.catalogs.${tab.id}.tab`,
    to: { query: { tab: tab.id } },
  })),
);
</script>

<template>
  <div class="flex flex-col gap-5">
    <AdminPageHeader :title="$t('admin.shell.screens.types')" :lead="$t('admin.catalogs.lead')">
      <template #actions><AdminBit placement="header" /></template>
    </AdminPageHeader>
    <AdminTabs :tabs="tabItems" :current="active ?? ''" :label="$t('admin.catalogs.tabsLabel')" />
    <LicenseCatalogPanel v-if="active === 'licenses'" />
    <TaxonCatalogPanel v-else-if="active" :key="active" :kind="active" />
  </div>
</template>
