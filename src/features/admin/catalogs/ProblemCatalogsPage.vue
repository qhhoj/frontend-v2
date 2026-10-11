<script setup lang="ts">
import { Plus } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { usePermissions } from '@/stores/use-permissions';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminTabs from '../ui/AdminTabs.vue';
import type { AdminTab } from '../ui/AdminTabs.vue';
import { buttonClass } from '../ui/controls';
import LicenseCatalogPanel from './LicenseCatalogPanel.vue';
import TaxonCatalogPanel from './TaxonCatalogPanel.vue';

/** One tab per catalog the viewer may change (`?tab=`); "Thêm …" in the header opens the tab's create drawer. */
const TABS = [
  {
    id: 'problem-types',
    permission: 'judge.change_problemtype',
    addPermission: 'judge.add_problemtype',
  },
  {
    id: 'problem-groups',
    permission: 'judge.change_problemgroup',
    addPermission: 'judge.add_problemgroup',
  },
  { id: 'licenses', permission: 'judge.change_license', addPermission: 'judge.add_license' },
] as const;

const route = useRoute();
const { can } = usePermissions();
const tabs = computed(() => TABS.filter((tab) => can(tab.permission)));
const active = computed(
  () => tabs.value.find((tab) => tab.id === route.query.tab) ?? tabs.value[0],
);
const tabItems = computed<AdminTab[]>(() =>
  tabs.value.map((tab) => ({
    key: tab.id,
    labelKey: `admin.catalogs.${tab.id}.tab`,
    to: { query: { tab: tab.id } },
  })),
);
const creating = ref(false);
watch(active, () => (creating.value = false));
</script>

<template>
  <div class="flex flex-col gap-4">
    <AdminPageHeader :title="$t('admin.shell.screens.types')" :lead="$t('admin.catalogs.lead')">
      <template v-if="active && can(active.addPermission)" #actions>
        <button type="button" :class="buttonClass('primary')" @click="creating = true">
          <Plus aria-hidden="true" class="size-4" :stroke-width="1.75" />
          {{ $t(`admin.catalogs.${active.id}.createTitle`) }}
        </button>
      </template>
    </AdminPageHeader>
    <AdminTabs
      :tabs="tabItems"
      :current="active?.id ?? ''"
      :label="$t('admin.catalogs.tabsLabel')"
    />
    <LicenseCatalogPanel v-if="active?.id === 'licenses'" v-model:creating="creating" />
    <TaxonCatalogPanel
      v-else-if="active"
      :key="active.id"
      v-model:creating="creating"
      :kind="active.id"
    />
  </div>
</template>
