<script setup lang="ts">
import { computed, watch } from 'vue';
import type { Language } from '@/api/types/problems';
import QueryState from '@/components/QueryState.vue';
import { useProblemMetaQuery } from '@/features/problems/problems.queries';
import AuthSelect from './AuthSelect.vue';
import PickerSkeleton from './PickerSkeleton.vue';
import SchoolPicker from './SchoolPicker.vue';
import { useOpenOrganizationsQuery } from './auth.queries';
import { defaultLanguageId } from './signup-choices';

withDefaults(defineProps<{ errors?: { organizationId?: string; languageId?: string } }>(), {
  errors: () => ({}),
});
const organizationId = defineModel<string>('organizationId', { required: true });
const languageId = defineModel<string>('languageId', { required: true });
const schools = useOpenOrganizationsQuery();
const meta = useProblemMetaQuery();
/** A file-only language (output only) cannot be somebody's default; the problem list's own filter applies too. */
const isSignupLanguage = (language: Language) => language.includeInProblem && !language.fileOnly;
const languages = computed(() => meta.data.value?.languages.filter(isSignupLanguage) ?? []);

/** Starts at C++17 once, when the languages first load. Later the viewer's choice (even "Chưa chọn") stays. */
let defaultApplied = false;
watch(
  languages,
  (list) => {
    if (defaultApplied || list.length === 0) return;
    defaultApplied = true;
    const defaultId = defaultLanguageId(list);
    if (languageId.value === '' && defaultId !== '') languageId.value = defaultId;
  },
  { immediate: true },
);
</script>

<template>
  <!-- One row of the signup grid (two columns from sm), the same row on social completion. -->
  <div class="grid gap-4 sm:col-span-2 sm:grid-cols-2">
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
    <QueryState
      :loading="meta.isPending.value"
      :error="meta.error.value"
      :registers-wait="false"
      @retry="meta.refetch()"
    >
      <template #skeleton><PickerSkeleton /></template>
      <AuthSelect
        v-if="languages.length"
        v-model="languageId"
        name="languageId"
        :label="$t('auth.signup.language')"
        :placeholder="$t('auth.signup.none')"
        :error="errors.languageId"
      >
        <option v-for="language in languages" :key="language.id" :value="language.id">
          {{ language.name }}
        </option>
      </AuthSelect>
    </QueryState>
  </div>
</template>
