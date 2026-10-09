<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Setting } from '@/api/types/settings-admin';
import AdminField from '../ui/AdminField.vue';
import AdminSwitch from '../ui/AdminSwitch.vue';
import { ADMIN_INPUT_CLASS } from '../ui/classes';
import { SETTING_KINDS } from './setting-blocks';
import type { ScalarDraft } from './setting-values';

const props = defineProps<{ setting: Setting }>();
const draft = defineModel<ScalarDraft>({ required: true });
const i18n = useI18n();

const kind = computed(() => SETTING_KINDS[props.setting.key]);
const label = computed(() => i18n.t(`admin.settings.fields.${props.setting.key}`));
/** The hint names the range or the meaning of one key; a key without one shows no hint. */
const hintKey = computed(() => `admin.settings.hints.${props.setting.key}`);
const hint = computed(() => (i18n.te(hintKey.value) ? i18n.t(hintKey.value) : undefined));
const value = computed({
  get: () => draft.value.value,
  set: (next: unknown) => (draft.value = { value: next }),
});
const isOn = computed({
  get: () => draft.value.value === true,
  set: (next: boolean) => (draft.value = { value: next }),
});
/** Browsers list every IANA zone; a missing `Intl.supportedValuesOf` leaves the box free text. */
const timeZones = computed(() =>
  typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [],
);
</script>

<template>
  <AdminSwitch v-if="kind.kind === 'boolean'" v-model="isOn" :label="label" />
  <AdminField v-else v-slot="{ id, describedBy }" :label="label" :hint="hint">
    <input
      v-if="kind.kind === 'integer'"
      :id="id"
      v-model.number="value"
      type="number"
      :min="kind.min"
      :max="kind.max"
      :aria-describedby="describedBy"
      :class="ADMIN_INPUT_CLASS"
    />
    <template v-else-if="kind.kind === 'timeZone'">
      <input
        :id="id"
        v-model="value"
        type="text"
        list="settings-time-zones"
        :aria-describedby="describedBy"
        :class="ADMIN_INPUT_CLASS"
      />
      <datalist id="settings-time-zones">
        <option v-for="zone in timeZones" :key="zone" :value="zone" />
      </datalist>
    </template>
    <input
      v-else
      :id="id"
      v-model="value"
      :type="kind.kind === 'url' ? 'url' : 'text'"
      :aria-describedby="describedBy"
      :class="ADMIN_INPUT_CLASS"
    />
  </AdminField>
</template>
