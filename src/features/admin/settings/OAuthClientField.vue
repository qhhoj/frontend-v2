<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminField from '../ui/AdminField.vue';
import AdminSwitch from '../ui/AdminSwitch.vue';
import { ADMIN_INPUT_CLASS } from '../ui/classes';
import SecretField from './SecretField.vue';
import type { OAuthDraft, SecretDraft } from './setting-values';

defineProps<{ provider: string }>();
const draft = defineModel<OAuthDraft>({ required: true });
const { t } = useI18n();

const enabled = computed({
  get: () => draft.value.enabled,
  set: (isEnabled: boolean) => (draft.value = { ...draft.value, enabled: isEnabled }),
});
const clientId = computed({
  get: () => draft.value.clientId,
  set: (next: string) => (draft.value = { ...draft.value, clientId: next }),
});
/** The secret's three parts sit in the OAuth draft under their own names. */
const secret = computed<SecretDraft>({
  get: () => ({
    isSet: draft.value.secretSet,
    isReplacing: draft.value.isReplacing,
    replacement: draft.value.secret,
  }),
  set: (part) =>
    (draft.value = {
      ...draft.value,
      secretSet: part.isSet,
      isReplacing: part.isReplacing,
      secret: part.replacement,
    }),
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <AdminSwitch v-model="enabled" :label="t('admin.settings.oauth.enable', { provider })" />
    <AdminField v-slot="{ id, describedBy }" :label="t('admin.settings.oauth.clientId')">
      <input
        :id="id"
        v-model="clientId"
        type="text"
        :aria-describedby="describedBy"
        :class="ADMIN_INPUT_CLASS"
      />
    </AdminField>
    <p v-if="enabled && clientId.trim() === ''" class="text-sm text-negative">
      {{ t('admin.settings.oauth.needsClientId') }}
    </p>
    <SecretField
      v-model="secret"
      :label="t('admin.settings.oauth.clientSecret')"
      :hint="t('admin.settings.oauth.secretHint')"
    />
  </div>
</template>
