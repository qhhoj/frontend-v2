<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import SettingsNotice from '@/features/account/settings/SettingsNotice.vue';
import type { SettingKey } from '@/api/types/settings-admin';
import RevisionsPanel from './RevisionsPanel.vue';
import { SETTING_BLOCKS } from './setting-blocks';

/** The per-key revision history of the settings page, for the key the URL names; it can restore. */
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const isSettingKey = (value: unknown): value is SettingKey =>
  SETTING_BLOCKS.some((block) => block.keys.some((key) => key === value));
const firstKey = SETTING_BLOCKS[0]!.keys[0]!;
const settingKey = computed<SettingKey>(() =>
  isSettingKey(route.query.key) ? route.query.key : firstKey,
);

function chooseKey(key: string) {
  void router.replace({ query: { ...route.query, key } });
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label for="log-key" class="text-sm font-semibold">{{
      t('admin.settings.log.keyLabel')
    }}</label>
    <select
      id="log-key"
      :value="settingKey"
      class="min-h-11 w-full max-w-md rounded-row border border-line-strong bg-surface-solid px-3 text-content"
      @change="chooseKey(($event.target as HTMLSelectElement).value)"
    >
      <optgroup
        v-for="block in SETTING_BLOCKS"
        :key="block.id"
        :label="t(`admin.settings.blocks.${block.id}.title`)"
      >
        <option v-for="key in block.keys" :key="key" :value="key">{{ key }}</option>
      </optgroup>
    </select>
  </div>
  <RevisionsPanel :setting-key="settingKey" :can-restore="true" />
  <SettingsNotice tone="info">
    <strong>{{ t('admin.settings.log.secrets.title') }}</strong> —
    {{ t('admin.settings.log.secrets.body') }}
  </SettingsNotice>
</template>
