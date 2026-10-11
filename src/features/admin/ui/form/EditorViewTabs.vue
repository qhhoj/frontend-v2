<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import AdminFilterTabs from '../AdminFilterTabs.vue';
import type { AdminFilterTab } from '../AdminFilterTabs.vue';
import type { EditorView } from './editor-view';
import { viewQuery } from './use-editor-view';

/**
 * The "Cơ bản / Nâng cao" switch above an editor form: two link tabs that set `?view=`. The Advanced tab counts its values
 * that differ from the defaults or from the last save; a tab that holds a field error carries a red dot.
 */
const props = defineProps<{
  view: EditorView;
  advancedCount: number;
  errorViews: readonly EditorView[];
}>();
const { t } = useI18n();
const route = useRoute();
const KEY = 'admin.form.view';

const tabs = computed<AdminFilterTab[]>(() =>
  (['basic', 'advanced'] as const).map((view) => ({
    key: view,
    label: t(`${KEY}.${view}`),
    to: { query: viewQuery(route.query, view) },
    count: view === 'advanced' ? props.advancedCount : undefined,
    countLabel: t(`${KEY}.changedCount`, { count: props.advancedCount }, props.advancedCount),
    countTestid: `editor-view-${view}-count`,
    alertLabel: props.errorViews.includes(view) ? t(`${KEY}.hasErrors`) : undefined,
    testid: `editor-view-${view}`,
  })),
);
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
    <AdminFilterTabs :tabs="tabs" :current="view" :label="t(`${KEY}.label`)" />
    <p class="m-0 text-sm text-muted">{{ t(`${KEY}.lead.${view}`) }}</p>
  </div>
</template>
