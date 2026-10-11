<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import SettingsNotice from '@/features/account/settings/SettingsNotice.vue';
import type { SettingKey } from '@/api/types/settings-admin';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import RevisionsPanel from './RevisionsPanel.vue';
import SettingBlock from './SettingBlock.vue';
import { SETTING_BLOCK_EXTRAS } from './setting-block-extras';
import { SETTING_GROUPS, shownBlocksOf } from './setting-blocks';
import { useSettingsQuery } from './settings.queries';

const { t } = useI18n();
const settings = useSettingsQuery();
const shown = computed(() => shownBlocksOf(settings.data.value ?? []));
const groups = computed(() =>
  SETTING_GROUPS.map((group) => ({
    group,
    blocks: shown.value.filter((block) => block.group === group),
  })).filter((entry) => entry.blocks.length > 0),
);
const historyKey = ref<SettingKey | null>(null);
const panel = ref<{ revealPanel: () => void } | null>(null);

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
</script>

<template>
  <AdminPageHeader :title="t('admin.settings.title')" :lead="t('admin.settings.lead')" />
  <nav :aria-label="t('admin.settings.groupsLabel')" class="flex flex-wrap gap-2 text-sm">
    <a
      v-for="entry in groups"
      :key="entry.group"
      :href="`#settings-${entry.group}`"
      class="rounded-pill border border-line px-3 py-1 hover:bg-surface-hover"
    >
      {{ t(`admin.settings.groups.${entry.group}`) }} {{ entry.blocks.length }}
    </a>
  </nav>
  <SettingsNotice tone="info">{{ t('admin.settings.infoCard') }}</SettingsNotice>
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
    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <div class="flex flex-col gap-8">
        <section
          v-for="entry in groups"
          :id="`settings-${entry.group}`"
          :key="entry.group"
          class="flex flex-col gap-4"
        >
          <SettingBlock
            v-for="block in entry.blocks"
            :key="block.id"
            :block="block"
            @history="openHistory"
          >
            <component
              :is="SETTING_BLOCK_EXTRAS[block.id]"
              v-if="SETTING_BLOCK_EXTRAS[block.id]"
              :settings="block.settings"
            />
          </SettingBlock>
        </section>
      </div>
      <aside v-if="historyKey" class="lg:sticky lg:top-4">
        <RevisionsPanel
          ref="panel"
          :setting-key="historyKey"
          :can-restore="true"
          closable
          @close="closeHistory"
        />
      </aside>
    </div>
  </QueryState>
</template>
