<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { usePermissions } from '@/stores/use-permissions';
import AdminBit from '../shell/AdminBit.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
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
</script>

<template>
  <div class="flex flex-col gap-5">
    <AdminPageHeader
      :crumbs="[{ label: $t('admin.shell.groups.content') }]"
      :title="$t('admin.shell.screens.types')"
      :lead="$t('admin.catalogs.lead')"
    >
      <template #actions><AdminBit placement="header" /></template>
    </AdminPageHeader>
    <nav :aria-label="$t('admin.catalogs.tabsLabel')" class="-mx-4 overflow-x-auto px-4">
      <ul class="flex min-w-max gap-1 border-b border-line">
        <li v-for="tab in tabs" :key="tab.id">
          <RouterLink
            :to="{ query: { tab: tab.id } }"
            class="inline-flex min-h-11 items-center border-b-2 border-transparent px-3 text-sm font-semibold text-muted hover:text-content aria-[current=page]:border-accent aria-[current=page]:text-content"
            :aria-current="active === tab.id ? 'page' : undefined"
          >
            {{ $t(`admin.catalogs.${tab.id}.tab`) }}
          </RouterLink>
        </li>
      </ul>
    </nav>
    <LicenseCatalogPanel v-if="active === 'licenses'" />
    <TaxonCatalogPanel v-else-if="active" :key="active" :kind="active" />
  </div>
</template>
