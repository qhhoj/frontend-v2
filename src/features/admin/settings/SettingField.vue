<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Setting } from '@/api/types/settings-admin';
import ScalarSettingField from './ScalarSettingField.vue';
import SecretField from './SecretField.vue';
import OAuthClientField from './OAuthClientField.vue';
import WebhooksField from './WebhooksField.vue';
import { SETTING_KINDS } from './setting-blocks';
import type {
  OAuthDraft,
  ScalarDraft,
  SecretDraft,
  SettingDraft,
  WebhooksDraft,
} from './setting-values';

/** Picks the control for a key's kind; each control owns its own draft shape. */
const props = defineProps<{ setting: Setting }>();
const draft = defineModel<SettingDraft>({ required: true });
const { t } = useI18n();

const kind = computed(() => SETTING_KINDS[props.setting.key].kind);
const providerName = computed(() => props.setting.key.split('.')[1] ?? '');
const providerLabel = computed(
  () => providerName.value.charAt(0).toUpperCase() + providerName.value.slice(1),
);
const secretHint = computed(() => t(`admin.settings.hints.${props.setting.key}`));
</script>

<template>
  <ScalarSettingField
    v-if="
      kind === 'timeZone' ||
      kind === 'boolean' ||
      kind === 'integer' ||
      kind === 'text' ||
      kind === 'url'
    "
    :model-value="draft as ScalarDraft"
    :setting="setting"
    @update:model-value="draft = $event"
  />
  <SecretField
    v-else-if="kind === 'secretText'"
    :model-value="draft as SecretDraft"
    :label="t(`admin.settings.fields.${setting.key}`)"
    :hint="secretHint"
    @update:model-value="draft = $event"
  />
  <OAuthClientField
    v-else-if="kind === 'oauth'"
    :model-value="draft as OAuthDraft"
    :provider="providerLabel"
    @update:model-value="draft = $event"
  />
  <WebhooksField
    v-else
    :model-value="draft as WebhooksDraft"
    @update:model-value="draft = $event"
  />
</template>
