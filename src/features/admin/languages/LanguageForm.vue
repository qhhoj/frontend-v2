<script setup lang="ts">
import { computed } from 'vue';
import type { LanguageAdmin } from '@/api/types/languages-admin';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import LanguageContentSection from './LanguageContentSection.vue';
import LanguageEditorSection from './LanguageEditorSection.vue';
import LanguageIdentitySection from './LanguageIdentitySection.vue';
import LanguageSaveBar from './LanguageSaveBar.vue';
import { useLanguageForm } from './use-language-form';

const props = defineProps<{ language: LanguageAdmin | null }>();
const { form, mode, errors, changeCount, saved, isPending, failure, submit } = useLanguageForm(
  props.language,
);
/** A refusal that no box can show (a field error is already under its box) goes on the page line. */
const pageFailure = computed(() =>
  failure.value && Object.keys(errors.value).length === 0 ? failureTextOf(failure.value) : null,
);
</script>

<template>
  <form class="flex flex-col gap-5" @submit.prevent="submit">
    <LanguageIdentitySection v-model:form="form" :mode="mode" :errors="errors" />
    <LanguageEditorSection v-model:form="form" :errors="errors" />
    <LanguageContentSection v-model:form="form" :errors="errors" />
    <AdminStatus v-if="pageFailure" kind="refused" :text="pageFailure" />
    <AdminStatus
      v-if="saved && mode === 'edit' && changeCount === 0"
      kind="done"
      :text="$t('admin.languages.form.saved')"
    />
    <LanguageSaveBar :mode="mode" :is-pending="isPending" :change-count="changeCount" />
  </form>
</template>
