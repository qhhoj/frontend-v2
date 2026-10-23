<script setup lang="ts">
import { problemTypeLabel } from '@/features/problems/problem-type-label';
import { computed, ref, useId } from 'vue';
import { Plus, X } from 'lucide-vue-next';
import type { ProblemEditingMeta } from '@/api/types/problem-editing';
import LanguageLabel from '@/components/language/LanguageLabel.vue';
import { usePermissions } from '@/stores/use-permissions';
import AdminField from '../../ui/AdminField.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { CHECK_CHIP, INPUT, buttonClass } from '../../ui/controls';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import { EDIT_ALL_PROBLEM, lockNotice } from './field-lock';
import type { ProblemForm } from './problem-form';

const form = defineModel<ProblemForm>({ required: true });
const props = defineProps<{ meta: ProblemEditingMeta; errors: FieldErrors; sectionId?: string }>();
const { can } = usePermissions();
const isStaffLocked = computed(() => !can(EDIT_ALL_PROBLEM));
const allowedLanguagesLockId = useId();
const pickedTypeId = ref('');

/** The select shows "Không ghi rõ" for no license, which the backend takes as `null`. */
const licenseValue = computed({
  get: () => form.value.licenseId ?? '',
  set: (value: string) => {
    form.value.licenseId = value || null;
  },
});
const unpickedTypes = computed(() =>
  props.meta.types.filter((type) => !form.value.typeIds.includes(type.id)),
);
const typeNameOf = (typeId: string) => {
  const type = props.meta.types.find((item) => item.id === typeId);
  return type ? problemTypeLabel(type) : typeId;
};

function addType() {
  if (!pickedTypeId.value) return;
  form.value.typeIds.push(pickedTypeId.value);
  pickedTypeId.value = '';
}

function removeType(typeId: string) {
  form.value.typeIds = form.value.typeIds.filter((id) => id !== typeId);
}

/** Quick picks for the allowed-language list: every language, none, or the site defaults for new problems. */
const LANGUAGE_PICKS = {
  all: () => props.meta.languages.map((language) => language.id),
  none: () => [],
  defaults: () =>
    props.meta.languages
      .filter((language) => language.includeInProblem)
      .map((language) => language.id),
} as const;
const pickLanguages = (pick: keyof typeof LANGUAGE_PICKS) => {
  form.value.allowedLanguages = LANGUAGE_PICKS[pick]();
};

function setLanguageAllowed(languageId: string, isAllowed: boolean) {
  const others = form.value.allowedLanguages.filter((id) => id !== languageId);
  form.value.allowedLanguages = isAllowed ? [...others, languageId] : others;
}
</script>

<template>
  <AdminFormSection
    :id="sectionId"
    :title="$t('admin.problems.general.sections.classes')"
    :description="$t('admin.problems.general.descriptions.classes')"
  >
    <AdminField
      v-slot="{ id, describedBy }"
      input-id="problem-group"
      :label="$t('admin.problems.general.classes.group')"
    >
      <select :id="id" v-model="form.groupId" :class="INPUT" :aria-describedby="describedBy">
        <option v-for="group in meta.groups" :key="group.id" :value="group.id">
          {{ group.fullName }}
        </option>
      </select>
    </AdminField>
    <AdminField
      v-slot="{ id, describedBy }"
      input-id="problem-license"
      :label="$t('admin.problems.general.classes.license')"
      :hint="lockNotice(isStaffLocked)"
    >
      <select
        :id="id"
        v-model="licenseValue"
        :class="INPUT"
        :disabled="isStaffLocked"
        :aria-describedby="describedBy"
      >
        <option value="">{{ $t('admin.problems.general.classes.noLicense') }}</option>
        <option v-for="license in meta.licenses" :key="license.id" :value="license.id">
          {{ license.name }}
        </option>
      </select>
    </AdminField>

    <div class="flex flex-col gap-2 lg:col-span-2">
      <h3 class="text-sm font-semibold">
        {{ $t('admin.problems.general.classes.types')
        }}<span aria-hidden="true" class="ml-0.5 text-negative">*</span>
      </h3>
      <ul v-if="form.typeIds.length > 0" class="flex flex-wrap gap-2">
        <li
          v-for="typeId in form.typeIds"
          :key="typeId"
          class="flex items-center gap-1 rounded-pill border border-line-strong py-0.5 pr-0.5 pl-3 text-sm"
        >
          {{ typeNameOf(typeId) }}
          <button
            type="button"
            class="inline-flex size-8 items-center justify-center rounded-pill text-muted hover:bg-surface-hover hover:text-content touch:size-11"
            :aria-label="$t('admin.ui.removeChip', { name: typeNameOf(typeId) })"
            @click="removeType(typeId)"
          >
            <X aria-hidden="true" class="size-4" :stroke-width="1.75" />
          </button>
        </li>
      </ul>
      <p v-if="errors.typeIds" class="text-sm text-negative">{{ errors.typeIds }}</p>
      <div v-if="unpickedTypes.length > 0" class="flex flex-wrap items-center gap-2">
        <select
          id="problem-type-pick"
          v-model="pickedTypeId"
          :aria-label="$t('admin.problems.general.classes.pickType')"
          :class="[INPUT, 'w-full sm:w-auto sm:max-w-80 sm:min-w-0 sm:flex-1']"
        >
          <option value="">{{ $t('admin.problems.general.classes.pickType') }}</option>
          <option v-for="type in unpickedTypes" :key="type.id" :value="type.id">
            {{ problemTypeLabel(type) }}
          </option>
        </select>
        <button type="button" :class="buttonClass('secondary')" @click="addType">
          <Plus aria-hidden="true" class="size-4" :stroke-width="1.75" />
          {{ $t('admin.problems.general.classes.addType') }}
        </button>
      </div>
    </div>

    <fieldset
      class="m-0 flex min-w-0 flex-col gap-2 border-0 p-0 lg:col-span-2"
      :aria-describedby="isStaffLocked ? allowedLanguagesLockId : undefined"
    >
      <legend class="text-sm font-semibold">
        {{ $t('admin.problems.general.classes.allowedLanguages') }}
        <span class="font-normal text-muted tabular-nums">{{
          $t('admin.problems.general.classes.allowedCount', {
            count: form.allowedLanguages.length,
            total: meta.languages.length,
          })
        }}</span>
      </legend>
      <div v-if="!isStaffLocked" class="-ml-2.5 flex flex-wrap gap-1">
        <button
          v-for="pick in ['all', 'none', 'defaults'] as const"
          :key="pick"
          type="button"
          :class="buttonClass('ghost', 'sm')"
          @click="pickLanguages(pick)"
        >
          {{ $t(`admin.problems.general.classes.pick.${pick}`) }}
        </button>
      </div>
      <div class="flex flex-wrap gap-2">
        <label v-for="language in meta.languages" :key="language.id" :class="CHECK_CHIP">
          <input
            type="checkbox"
            class="size-4 accent-accent"
            :checked="form.allowedLanguages.includes(language.id)"
            :disabled="isStaffLocked"
            @change="setLanguageAllowed(language.id, ($event.target as HTMLInputElement).checked)"
          />
          <LanguageLabel :language="language" />
        </label>
      </div>
      <p v-if="isStaffLocked" :id="allowedLanguagesLockId" class="text-xs text-muted">
        {{ lockNotice(isStaffLocked) }}
      </p>
    </fieldset>
  </AdminFormSection>
</template>
