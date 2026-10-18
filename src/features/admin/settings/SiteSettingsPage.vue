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
import ToolbarSearch from '@/components/ToolbarSearch.vue';
import { SITE_NOTICE_KEY } from '@/features/site-notice/site-notice';
import { usePermissions } from '@/stores/use-permissions';
import { useSiteAdminQuery } from '../site/site.queries';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminLeaveGuard from '../ui/form/AdminLeaveGuard.vue';
import RevisionsPanel from './RevisionsPanel.vue';
import SettingBlock from './SettingBlock.vue';
import SiteNoticeBlock from './SiteNoticeBlock.vue';
import { SETTING_BLOCK_EXTRAS } from './setting-block-extras';
import { NOTICE_BLOCK, SETTING_TABS, shownBlocksOf } from './setting-blocks';
import type { SettingBlockSpec, SettingTab } from './setting-blocks';
import { settingSearchHits } from './setting-search';
import type { SearchableRow } from './setting-search';
import { dirtyByTab, saveDirtyBlocks, tabFromQuery } from './settings-page';
import { useSettingsQuery } from './settings.queries';

/**
 * Site settings: one tab per topic (`?tab=`), every block of every tab mounted so a tab switch keeps unsaved edits, and one
 * save bar for the page. Its "Lưu" saves each changed block in page order; a refused block keeps its alert and the page
 * opens that block's tab. Each tab counts its unsaved keys. A search shows the matching rows of every tab at once; the
 * "Văn bản công khai" tab holds the site notice (formerly "Cấu hình thô"), for viewers who may change it.
 */
const i18n = useI18n();
const { t } = i18n;
const route = useRoute();
const router = useRouter();
const { can } = usePermissions();
const canSettings = computed(() => can('judge.change_settings'));
const canNotice = computed(() => can('judge.change_miscconfig'));
const settings = useSettingsQuery(canSettings);
const site = useSiteAdminQuery(canNotice);
const shown = computed(() => shownBlocksOf(settings.data.value ?? []));
/** Every block the page saves, the notice last: tab counts, the save order and the refused-tab jump read it. */
const pageBlocks = computed<SettingBlockSpec[]>(() => [
  ...shown.value,
  ...(canNotice.value ? [NOTICE_BLOCK] : []),
]);
const tabsShown = computed(() =>
  SETTING_TABS.filter((tab) => pageBlocks.value.some((block) => block.tab === tab)),
);
const activeTab = computed(() => {
  const tab = tabFromQuery(route.query.tab);
  return tabsShown.value.includes(tab) ? tab : (tabsShown.value[0] ?? tab);
});
/** The page waits for the settings only; the notice block loads on its own, so a `/site` failure never hides a setting. */
const isLoading = computed(() => canSettings.value && settings.isPending.value);
const loadError = computed(() => (canSettings.value ? settings.error.value : null));
const isNoticeLoaded = computed(() => canNotice.value && site.data.value !== undefined);
const notice = computed(() => site.data.value?.config[SITE_NOTICE_KEY] ?? null);

const searchText = ref('');
const optionalText = (key: string) => (i18n.te(key) ? [t(key)] : []);
const searchRows = computed<SearchableRow[]>(() => [
  ...shown.value.flatMap((block) =>
    block.settings.map((setting) => ({
      key: setting.key,
      texts: [
        setting.key,
        ...optionalText(`admin.settings.fields.${setting.key}`),
        ...optionalText(`admin.settings.hints.${setting.key}`),
        t(`admin.settings.blocks.${block.id}.title`),
        t(`admin.settings.blocks.${block.id}.help`),
      ],
    })),
  ),
  ...(canNotice.value
    ? [
        {
          key: SITE_NOTICE_KEY,
          texts: [SITE_NOTICE_KEY, t('admin.site.notice.title'), t('admin.site.notice.label')],
        },
      ]
    : []),
]);
const hits = computed(() => settingSearchHits(searchText.value, searchRows.value));
const blockHasHits = (block: SettingBlockSpec) =>
  !hits.value ||
  (block.id === NOTICE_BLOCK.id
    ? hits.value.has(SITE_NOTICE_KEY)
    : block.keys.some((key) => hits.value!.has(key)));
const isNoticeHit = computed(() => blockHasHits(NOTICE_BLOCK));
/** While searching every tab with a hit shows; otherwise only the open tab. */
const isTabShown = (tab: SettingTab) =>
  hits.value
    ? pageBlocks.value.some((block) => block.tab === tab && blockHasHits(block))
    : tab === activeTab.value;

/** Unsaved keys per block: the save bar, the tab counts and the leave guard read them. */
const dirtyByBlock = reactive<Record<string, number>>({});
const dirtyCount = computed(() =>
  Object.values(dirtyByBlock).reduce((total, count) => total + count, 0),
);
const dirtyTabs = computed(() => dirtyByTab(pageBlocks.value, dirtyByBlock));
const tabItems = computed<TabItem[]>(() =>
  tabsShown.value.map((tab) => {
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

/** What the save bar needs of a block: `SettingBlock` and `SiteNoticeBlock` both expose it. */
type BlockHandle = Pick<InstanceType<typeof SettingBlock>, 'save' | 'discard'>;
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
    pageBlocks.value.map((block) => block.id),
    { ...dirtyByBlock },
    (id) => blockRefs.get(id)!.save(),
  );
  isSaving.value = false;
  if (refused.length > 0) return showRefusedBlock(refused[0]!);
  if (saved.length > 0) savedAt.value = new Date();
}

/** A refusal is shown on its block: open that block's tab and bring the block into view. */
async function showRefusedBlock(id: string) {
  const tab = pageBlocks.value.find((block) => block.id === id)!.tab;
  searchText.value = '';
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
watch([activeTab, () => hits.value === null], () => (historyKey.value = null));

/** Opens a key's history and brings it into view: on a phone the panel sits below every block. */
async function openHistory(key: SettingKey) {
  historyKey.value = key;
  await nextTick();
  panel.value?.revealPanel();
}

/** Closes the panel and returns focus to the ⓘ button whose "Lịch sử" opened it. */
function closeHistory() {
  const openerId = `info-${historyKey.value}`;
  historyKey.value = null;
  document.getElementById(openerId)?.focus();
}

const blocksOf = (tab: SettingTab) => shown.value.filter((block) => block.tab === tab);
const SAVE_FORM_ID = 'site-settings-save';
</script>

<template>
  <AdminPageHeader :title="t('admin.settings.title')" :lead="t('admin.settings.lead')" />
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
    <ToolbarSearch
      v-model="searchText"
      class="w-full sm:max-w-sm"
      :label="t('admin.settings.search.label')"
      :placeholder="t('admin.settings.search.placeholder')"
      :maxlength="100"
    />
    <p v-if="hits" role="status" class="m-0 text-meta text-muted">
      {{ t('admin.settings.search.results', hits.size) }}
    </p>
  </div>
  <Tabs
    v-if="!hits && !isLoading && !loadError"
    :items="tabItems"
    :model-value="activeTab"
    :label="t('admin.settings.tabsLabel')"
    variant="underline"
    :more-label="t('admin.shell.moreTabs')"
  />
  <AdminLeaveGuard :dirty-count="dirtyCount" />
  <QueryState :loading="isLoading" :error="loadError" @retry="settings.refetch()">
    <template #skeleton
      ><SkeletonBlock
        data-skeleton-region="settings-block"
        class="h-[24.4rem] w-full sm:h-[23.9rem]"
    /></template>
    <div
      class="grid min-w-0 items-start gap-6"
      :class="historyKey && 'xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]'"
    >
      <div class="flex min-w-0 flex-col gap-6">
        <section
          v-for="tab in tabsShown"
          v-show="isTabShown(tab)"
          :key="tab"
          :data-tab="tab"
          :aria-label="t(`admin.settings.tabs.${tab}`)"
          class="flex min-w-0 flex-col gap-3"
        >
          <h2 v-if="hits" class="font-display text-sm font-semibold text-muted">
            {{ t(`admin.settings.tabs.${tab}`) }}
          </h2>
          <div
            class="grid min-w-0 items-start gap-4"
            :class="!historyKey && !hits && blocksOf(tab).length > 1 && 'xl:grid-cols-2'"
          >
            <SettingBlock
              v-for="block in blocksOf(tab)"
              v-show="blockHasHits(block)"
              :key="block.id"
              :ref="bindBlock(block.id)"
              :block="block"
              :shown-keys="hits"
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
            <QueryState
              v-if="tab === NOTICE_BLOCK.tab && canNotice && !isNoticeLoaded"
              :loading="site.isPending.value"
              :error="site.error.value"
              @retry="site.refetch()"
            >
              <template #skeleton><SkeletonBlock class="h-64 w-full" /></template>
            </QueryState>
            <SiteNoticeBlock
              v-if="tab === NOTICE_BLOCK.tab && isNoticeLoaded"
              :ref="bindBlock(NOTICE_BLOCK.id)"
              :current="notice"
              :shown="isNoticeHit"
              class="scroll-mt-4"
              @dirty="(count) => (dirtyByBlock.notice = count)"
            />
          </div>
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
