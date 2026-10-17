<script setup lang="ts">
import { computed } from 'vue';
import ToolbarSelect from '@/components/ToolbarSelect.vue';
import { LOCALES, isLocale, translate } from '@/i18n';
import { useLocaleStore } from '@/stores/locale.store';

/** Next to the section nav, outside every form: it applies at once and only on this device, so no save bar owns it. */
const locale = useLocaleStore();
const options = computed(() =>
  LOCALES.map((code) => ({ value: code, label: translate(`settings.locales.${code}`) })),
);
const choose = (value: string) => {
  if (isLocale(value)) locale.locale = value;
};
</script>

<template>
  <div class="flex flex-col items-start gap-1 sm:items-end">
    <ToolbarSelect
      data-testid="interface-language"
      :label="$t('settings.defaults.interfaceLanguage')"
      :model-value="locale.locale"
      :options="options"
      :active="false"
      @update:model-value="choose"
    />
    <p class="text-caption text-muted">
      {{ $t('settings.defaults.deviceOnly') }}
    </p>
  </div>
</template>
