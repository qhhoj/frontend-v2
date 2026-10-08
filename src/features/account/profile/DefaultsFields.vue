<script setup lang="ts">
import { computed } from 'vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AuthSelect from '@/features/auth/AuthSelect.vue';
import { useProblemMetaQuery } from '@/features/problems/problems.queries';
import { LOCALES, isLocale } from '@/i18n';
import { useLocaleStore } from '@/stores/locale.store';
import SettingsCard from '../settings/SettingsCard.vue';
import { profileFieldId } from './profile-field-ids';
import { timeZoneOptions } from './time-zones';

/** Board SetProfile "Mặc định và hiển thị", without the editor colour and maths engine (Decision 4). */
defineProps<{ errors: Record<string, string> }>();
const languageId = defineModel<string | null>('languageId', { required: true });
const timezone = defineModel<string>('timezone', { required: true });
const locale = useLocaleStore();
const meta = useProblemMetaQuery();
/** A file-only language cannot be typed into the editor, so it is no default. */
const languages = computed(
  () => meta.data.value?.languages.filter((language) => !language.fileOnly) ?? [],
);
/** `''` is how the select says "none"; the draft keeps `null`. */
const languageChoice = computed({
  get: () => languageId.value ?? '',
  set: (value: string) => {
    languageId.value = value || null;
  },
});
/** The select speaks `string`; the store only takes a known locale. */
const interfaceLanguage = computed({
  get: () => locale.locale,
  set: (value: string) => {
    if (isLocale(value)) locale.locale = value;
  },
});
const zones = computed(() => timeZoneOptions(timezone.value, new Date()));
</script>

<template>
  <SettingsCard :title="$t('settings.defaults.title')" :lead="$t('settings.defaults.lead')">
    <div class="grid gap-4 md:grid-cols-2">
      <!-- Beside a form the viewer can already use: no page-wide loading Bit for the language list. -->
      <QueryState
        :loading="meta.isPending.value"
        :error="meta.error.value"
        :registers-wait="false"
        @retry="meta.refetch()"
      >
        <template #skeleton><SkeletonBlock class="h-[98px] w-full" /></template>
        <AuthSelect
          :id="profileFieldId('languageId')"
          v-model="languageChoice"
          name="languageId"
          class="scroll-mb-28"
          :optional="false"
          :label="$t('settings.profile.fieldName.languageId')"
          :placeholder="languageId === null ? $t('settings.defaults.noLanguage') : undefined"
          :hint="$t('settings.defaults.languageHint')"
          :error="errors.languageId"
        >
          <option v-for="language in languages" :key="language.id" :value="language.id">
            {{ language.name }}
          </option>
        </AuthSelect>
      </QueryState>
      <AuthSelect
        :id="profileFieldId('timezone')"
        v-model="timezone"
        name="timezone"
        class="scroll-mb-28"
        :optional="false"
        :label="$t('settings.profile.fieldName.timezone')"
        :hint="$t('settings.defaults.timezoneHint')"
        :error="errors.timezone"
      >
        <option v-for="zone in zones" :key="zone.value" :value="zone.value">
          {{ zone.label }}
        </option>
      </AuthSelect>
      <AuthSelect
        v-model="interfaceLanguage"
        name="locale"
        :optional="false"
        :label="$t('settings.defaults.interfaceLanguage')"
      >
        <option v-for="code in LOCALES" :key="code" :value="code">
          {{ $t(`settings.locales.${code}`) }}
        </option>
      </AuthSelect>
    </div>
    <p class="text-[13px] leading-normal text-muted">
      <span
        class="rounded-pill bg-verdict-pending-bg px-2.5 py-0.5 text-xs font-semibold text-verdict-pending"
        >{{ $t('settings.defaults.deviceOnly') }}</span
      >
      {{ $t('settings.defaults.deviceOnlyNote') }}
    </p>
  </SettingsCard>
</template>
