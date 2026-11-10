<script setup lang="ts">
import { computed } from 'vue';
import { translate } from '@/i18n';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import ComboBox from '@/components/ui/ComboBox.vue';
import FormField from '@/components/ui/FormField.vue';
import SelectField from '@/components/ui/SelectField.vue';
import { useProblemMetaQuery } from '@/features/problems/problems.queries';
import { profileFieldId } from './profile-field-ids';
import { timeZoneOptions } from './time-zones';
import { SITE_TIME_ZONE, viewerTimeZone } from '@/lib/format-date';

/** The submit defaults inside the profile card, right under the name: the setting every pupil needs comes first. */
defineProps<{ errors: Record<string, string> }>();
const languageId = defineModel<string | null>('languageId', { required: true });
const timezone = defineModel<string>('timezone', { required: true });
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
/** The site's zone and the browser's come first, then every zone (searchable). */
const browserZone = viewerTimeZone();
const zones = computed(() => {
  const options = timeZoneOptions(timezone.value, new Date(), [SITE_TIME_ZONE, browserZone]);
  return options.map((zone) =>
    zone.value === browserZone && browserZone !== SITE_TIME_ZONE
      ? { ...zone, label: `${zone.label} · ${translate('settings.defaults.browserZone')}` }
      : zone,
  );
});
</script>

<template>
  <div class="grid gap-5 md:grid-cols-2">
    <!-- Beside a form the viewer can already use: no page-wide loading Bit for the language list. -->
    <QueryState
      :loading="meta.isPending.value"
      :error="meta.error.value"
      :registers-wait="false"
      @retry="meta.refetch()"
    >
      <template #skeleton><SkeletonBlock class="h-24.5 w-full" /></template>
      <FormField
        :input-id="profileFieldId('languageId')"
        class="scroll-mb-28"
        :label="$t('settings.profile.fieldName.languageId')"
        :hint="$t('settings.defaults.languageHint')"
        :error="errors.languageId"
      >
        <SelectField
          v-model="languageChoice"
          name="languageId"
          :placeholder="languageId === null ? $t('settings.defaults.noLanguage') : undefined"
        >
          <option v-for="language in languages" :key="language.id" :value="language.id">
            {{ language.name }}
          </option>
        </SelectField>
      </FormField>
    </QueryState>
    <FormField
      :input-id="profileFieldId('timezone')"
      class="scroll-mb-28"
      :label="$t('settings.profile.fieldName.timezone')"
      :hint="$t('settings.defaults.timezoneHint')"
      :error="errors.timezone"
    >
      <ComboBox
        v-model="timezone"
        :options="zones"
        filter
        :filter-label="$t('settings.defaults.timezoneFilter')"
        :filter-placeholder="$t('settings.defaults.timezoneSearch')"
        :empty-filter-message="$t('settings.defaults.timezoneNone')"
      />
    </FormField>
  </div>
</template>
