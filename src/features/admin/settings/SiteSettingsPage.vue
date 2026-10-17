<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import SaveBar from '@/components/ui/SaveBar.vue';
import Tabs from '@/components/ui/Tabs.vue';
import type { TabItem } from '@/components/ui/Tabs.vue';
import type { SettingKey } from '@/api/types/settings-admin';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminLeaveGuard from '../ui/form/AdminLeaveGuard.vue';
import RevisionsPanel from './RevisionsPanel.vue';
import SettingBlock from './SettingBlock.vue';
import { SETTING_BLOCK_EXTRAS } from './setting-block-extras';
import { SETTING_TABS, shownBlocksOf } from './setting-blocks';
import type { SettingTab } from './setting-blocks';
import { dirtyByTab, saveDirtyBlocks, tabFromQuery } from './settings-page';
import { useSettingsQuery } from './settings.queries';

/**
 * Site settings: one tab per topic (`?tab=`), every block of every tab mounted so a tab switch keeps unsaved edits, and one
 * save bar for the page. Its "Lưu" saves each changed block in page order; a refused block keeps its alert and the page
 * opens that block's tab. Each tab counts its unsaved keys.
 */
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const settings = useSettingsQuery();
const shown = computed(() => shownBlocksOf(settings.data.value ?? []));
const activeTab = computed(() => tabFromQuery(route.query.tab));

/** Unsaved keys per block: the save bar, the tab counts and the leave guard read them. */
const dirtyByBlock = reactive<Record<string, number>>({});
const dirtyCount = computed(() =>
  Object.values(dirtyByBlock).reduce((total, count) => total + count, 0),
);
const dirtyTabs = computed(() => dirtyByTab(shown.value, dirtyByBlock));
const tabItems = computed<TabItem[]>(() =>
  SETTING_TABS.filter((tab) => shown.value.some((block) => block.tab === tab)).map((tab) => {
    const unsaved = dirtyTabs.value[tab];
    return {
      key: tab,
      label: t(`admin.settings.tabs.${tab}`),
      to: { query: { ...route.query, tab } },
      count: unsaved > 0 ? unsaved : null,
      countTone: 'accent',
      countLabel: unsaved > 0 ? t('form.saveBar.unsaved', unsaved) : undefined,
      testid: `settings-tab-${tab}`,
    };
  }),
);

type BlockHandle = InstanceType<typeof SettingBlock>;
const blockRefs = new Map<string, BlockHandle>();
const bindBlock = (id: string) => (handle: unknown) => {
  if (handle) blockRefs.set(id, handle as BlockHandle);
  else blockRefs.delete(id);
};

const isSaving = ref(false);
const savedAt = ref<Date | null>(null);

async function saveAll() {
  if (isSaving.value || dirtyCount.value === 0) return;
  isSaving.value = true;
  const { saved, refused } = await saveDirtyBlocks(
    shown.value.map((block) => block.id),
    { ...dirtyByBlock },
    (id) => blockRefs.get(id)!.save(),
  );
  isSaving.value = false;
  if (refused.length > 0) return showRefusedBlock(refused[0]!);
  if (saved.length > 0) savedAt.value = new Date();
}

/** A refusal is shown on its block: open that block's tab and bring the block into view. */
async function showRefusedBlock(id: string) {
  const tab = shown.value.find((block) => block.id === id)!.tab;
  if (tab !== activeTab.value) await router.replace({ query: { ...route.query, tab } });
  await nextTick();
  document.querySelector(`[data-block="${id}"]`)?.scrollIntoView({ block: 'start' });
}

function discardAll() {
  for (const handle of blockRefs.values()) handle.discard();
}

const historyKey = ref<SettingKey | null>(null);
const panel = ref<{ revealPanel: () => void } | null>(null);
/** The history panel belongs to a key of the tab on screen. */
watch(activeTab, () => (historyKey.value = null));

/** Opens a key's history and brings it into view: on a phone the panel sits below every block. */
async function openHistory(key: SettingKey) {
  historyKey.value = key;
  await nextTick();
  panel.value?.revealPanel();
}

/** Closes the panel and returns focus to the "Lịch sử" button that opened it. */
function closeHistory() {
  const openerId = `history-${historyKey.value}`;
  historyKey.value = null;
  document.getElementById(openerId)?.focus();
}

const blocksOf = (tab: SettingTab) => shown.value.filter((block) => block.tab === tab);
const SAVE_FORM_ID = 'site-settings-save';
</script>

<template>
  <AdminPageHeader :title="t('admin.settings.title')" :lead="t('admin.settings.lead')" />
  <Tabs
    :items="tabItems"
    :model-value="activeTab"
    :label="t('admin.settings.tabsLabel')"
    variant="underline"
    :more-label="t('admin.shell.moreTabs')"
  />
  <AdminLeaveGuard :dirty-count="dirtyCount" />
  <QueryState
    :loading="settings.isPending.value"
    :error="settings.error.value"
    @retry="settings.refetch()"
  >
    <template #skeleton
      ><SkeletonBlock
        data-skeleton-region="settings-block"
        class="h-[24.4rem] w-full sm:h-[23.9rem]"
    /></template>
    <div
      class="grid min-w-0 items-start gap-6"
      :class="historyKey && 'xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]'"
    >
      <div class="min-w-0">
        <section
          v-for="tab in SETTING_TABS"
          v-show="tab === activeTab"
          :key="tab"
          :data-tab="tab"
          :aria-label="t(`admin.settings.tabs.${tab}`)"
          class="grid min-w-0 items-start gap-4"
          :class="!historyKey && blocksOf(tab).length > 1 && 'xl:grid-cols-2'"
        >
          <SettingBlock
            v-for="block in blocksOf(tab)"
            :key="block.id"
            :ref="bindBlock(block.id)"
            :block="block"
            class="scroll-mt-4"
            @history="openHistory"
            @dirty="(count) => (dirtyByBlock[block.id] = count)"
          >
            <component
              :is="SETTING_BLOCK_EXTRAS[block.id]"
              v-if="SETTING_BLOCK_EXTRAS[block.id]"
              :settings="block.settings"
            />
          </SettingBlock>
        </section>
      </div>
      <aside v-if="historyKey" class="min-w-0 xl:sticky xl:top-4">
        <RevisionsPanel
          ref="panel"
          :setting-key="historyKey"
          :can-restore="true"
          closable
          @close="closeHistory"
        />
      </aside>
    </div>
    <form :id="SAVE_FORM_ID" novalidate @submit.prevent="saveAll" />
    <SaveBar
      data-testid="settings-save-bar"
      :form="SAVE_FORM_ID"
      :dirty-count="dirtyCount"
      :pending="isSaving"
      :saved-at="savedAt"
      @discard="discardAll"
    />
  </QueryState>
</template>
