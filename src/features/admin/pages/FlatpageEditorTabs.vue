<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AdminTabs from '../ui/AdminTabs.vue';
import type { AdminTab } from '../ui/AdminTabs.vue';

/** `hasHistory` is false for a page not saved yet; `historyTotal` is null while the count is unknown (loading or failed). */
const props = defineProps<{
  active: 'edit' | 'history';
  hasHistory: boolean;
  historyTotal: number | null;
}>();
const route = useRoute();
const tabs = computed<AdminTab[]>(() => [
  {
    key: 'edit',
    labelKey: 'admin.pages.tabs.edit',
    to: { query: { ...route.query, tab: undefined, hp: undefined } },
  },
  ...(props.hasHistory
    ? [
        {
          key: 'history',
          labelKey: 'admin.pages.tabs.history',
          to: { query: { ...route.query, tab: 'history' } },
          count: props.historyTotal,
        },
      ]
    : []),
]);
</script>

<template>
  <AdminTabs
    data-testid="editor-tabs"
    :tabs="tabs"
    :current="active"
    :label="$t('admin.pages.tabs.label')"
  />
</template>
