<script setup lang="ts">
import { computed, watch } from 'vue';
import type { Language } from '@/api/types/problems';
import QueryState from '@/components/QueryState.vue';
import { useProblemMetaQuery } from '@/features/problems/problems.queries';
import PickerSkeleton from './PickerSkeleton.vue';
import SchoolPicker from './SchoolPicker.vue';
import { useOpenOrganizationsQuery } from './auth.queries';
import { defaultLanguageId } from './signup-choices';

withDefaults(defineProps<{ errors?: { organizationId?: string } }>(), {
  errors: () => ({}),
});
const organizationId = defineModel<string>('organizationId', { required: true });
/** Not shown: `undefined` until the languages load, then C++17, so the account starts with the ruled default. */
const languageId = defineModel<string | undefined>('languageId');
const schools = useOpenOrganizationsQuery();
const meta = useProblemMetaQuery();
/** A file-only language (output only) cannot be somebody's default; the problem list's own filter applies too. */
const isSignupLanguage = (language: Language) => language.includeInProblem && !language.fileOnly;
const languages = computed(() => meta.data.value?.languages.filter(isSignupLanguage) ?? []);

/** Once the languages load, a parent that never set the language starts at C++17. */
watch(
  languages,
  (list) => {
    if (languageId.value !== undefined || list.length === 0) return;
    const defaultId = defaultLanguageId(list);
    if (defaultId !== '') languageId.value = defaultId;
  },
  { immediate: true },
);
</script>

<template>
  <!-- One full row of the signup grid. No language picker here; new accounts start at C++17 (set above), changed later in the settings or by the submit box, which remembers the last one. -->
  <div class="sm:col-span-2">
    <QueryState
      :loading="schools.isPending.value"
      :error="schools.error.value"
      :registers-wait="false"
      @retry="schools.refetch()"
    >
      <template #skeleton><PickerSkeleton /></template>
      <SchoolPicker
        v-if="schools.data.value?.length"
        v-model="organizationId"
        :schools="schools.data.value"
        :error="errors.organizationId"
      />
    </QueryState>
  </div>
</template>
