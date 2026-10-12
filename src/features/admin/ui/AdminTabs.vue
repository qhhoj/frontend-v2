<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { RouteLocationRaw } from 'vue-router';
import { useRoute } from 'vue-router';
import Tabs from '@/components/ui/Tabs.vue';

export interface AdminTab {
  key: string;
  labelKey: string;
  to: RouteLocationRaw;
  /** A count chip after the label; hidden while null or absent. */
  count?: number | null;
  /** Read instead of the bare number ("3 yêu cầu chờ duyệt"). */
  countLabel?: string;
  countTestid?: string;
  testid?: string;
}

/**
 * Underlined tabs that switch a page's sections: by route (`key` is the route name, the default `current`) or by query.
 * `Tabs` in its underline look, with the "⋯" menu for tabs out of view.
 */
const props = defineProps<{
  tabs: AdminTab[];
  label: string;
  current?: string;
  sticky?: boolean;
}>();
const route = useRoute();
const { t } = useI18n();
const currentKey = computed(() => props.current ?? String(route.name));
const items = computed(() =>
  props.tabs.map(({ labelKey, ...tab }) => ({ ...tab, label: t(labelKey) })),
);
</script>

<template>
  <Tabs
    :items="items"
    :label="label"
    :model-value="currentKey"
    variant="underline"
    :sticky="sticky"
    :more-label="t('admin.shell.moreTabs')"
    more-testid="admin-tabs-more"
  />
</template>
