<script setup lang="ts">
import { computed } from 'vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AuthSelect from '@/features/auth/AuthSelect.vue';
import { useProblemMetaQuery } from '@/features/problems/problems.queries';
import { profileFieldId } from './profile-field-ids';
import { timeZoneOptions } from './time-zones';

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
const zones = computed(() => timeZoneOptions(timezone.value, new Date()));
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
  </div>
</template>
