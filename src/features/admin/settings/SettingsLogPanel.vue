<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import type { SettingKey } from '@/api/types/settings-admin';
import { INPUT } from '../ui/controls';
import AdminNotice from '../ui/feedback/AdminNotice.vue';
import RevisionsPanel from './RevisionsPanel.vue';
import { SETTING_BLOCKS } from './setting-blocks';

/** The per-key revision history of the settings page, for the key the URL names; it can restore. */
const route = useRoute();
const router = useRouter();
const i18n = useI18n();
const { t } = i18n;

const isSettingKey = (value: unknown): value is SettingKey =>
  SETTING_BLOCKS.some((block) => block.keys.some((key) => key === value));
const firstKey = SETTING_BLOCKS[0]!.keys[0]!;
const settingKey = computed<SettingKey>(() =>
  isSettingKey(route.query.key) ? route.query.key : firstKey,
);

/** The key's field label where it has one ("URL SMTP"), else the block's title (one-key blocks such as Google sign-in). */
function keyLabel(key: SettingKey, blockId: string): string {
  const field = `admin.settings.fields.${key}`;
  return i18n.te(field) ? t(field) : t(`admin.settings.blocks.${blockId}.title`);
}

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
      :class="[INPUT, 'max-w-md']"
      @change="chooseKey(($event.target as HTMLSelectElement).value)"
    >
      <optgroup
        v-for="block in SETTING_BLOCKS"
        :key="block.id"
        :label="t(`admin.settings.blocks.${block.id}.title`)"
      >
        <option v-for="key in block.keys" :key="key" :value="key">
          {{ keyLabel(key, block.id) }}
        </option>
      </optgroup>
    </select>
  </div>
  <RevisionsPanel :setting-key="settingKey" :can-restore="true" />
  <AdminNotice
    :title="t('admin.settings.log.secrets.title')"
    :summary="t('admin.settings.log.secrets.body')"
  />
</template>
