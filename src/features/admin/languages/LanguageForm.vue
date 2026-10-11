<script setup lang="ts">
import { computed } from 'vue';
import type { LanguageAdmin } from '@/api/types/languages-admin';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { CARD, buttonClass } from '../ui/controls';
import AdminLeaveGuard from '../ui/form/AdminLeaveGuard.vue';
import AdminSaveBar from '../ui/form/AdminSaveBar.vue';
import LanguageContentSection from './LanguageContentSection.vue';
import LanguageEditorSection from './LanguageEditorSection.vue';
import LanguageIdentitySection from './LanguageIdentitySection.vue';
import { useLanguageForm } from './use-language-form';

const props = defineProps<{ language: LanguageAdmin | null }>();
const { form, mode, errors, changeCount, savedAt, isPending, failure, submit, discard } =
  useLanguageForm(props.language);
/** A refusal that no box can show (a field error is already under its box) goes on the page line. */
const pageFailure = computed(() =>
  failure.value && Object.keys(errors.value).length === 0 ? failureTextOf(failure.value) : null,
);
</script>

<template>
  <form class="flex flex-col gap-5" @submit.prevent="submit">
    <fieldset :disabled="isPending" :class="[CARD, 'm-0 flex min-w-0 flex-col p-0']">
      <LanguageIdentitySection v-model:form="form" :mode="mode" :errors="errors" />
      <LanguageEditorSection v-model:form="form" :errors="errors" />
      <LanguageContentSection v-model:form="form" :errors="errors" />
    </fieldset>
    <AdminStatus v-if="pageFailure" kind="refused" :text="pageFailure" />
    <AdminSaveBar
      data-testid="language-save-bar"
      :dirty-count="changeCount"
      :pending="isPending"
      :saved-at="savedAt"
      :allow-clean="mode === 'create'"
      :save-label="
        mode === 'create' ? $t('admin.languages.form.create') : $t('admin.languages.form.save')
      "
      @discard="discard"
    >
      <template v-if="mode === 'create'" #status>
        <span class="text-muted">{{ $t('admin.languages.form.required') }}</span>
      </template>
      <template v-if="mode === 'create'" #actions>
        <RouterLink :to="{ name: 'admin-languages' }" :class="buttonClass('ghost')">
          {{ $t('admin.languages.form.cancel') }}
        </RouterLink>
      </template>
    </AdminSaveBar>
    <AdminLeaveGuard v-if="mode === 'edit'" :dirty-count="changeCount" />
  </form>
</template>
