<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import type { ProblemEditingMeta } from '@/api/types/problem-editing';
import { usePermissions } from '@/stores/use-permissions';
import AdminField from '../../ui/AdminField.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { ADMIN_BUTTON_CLASS, ADMIN_INPUT_CLASS } from '../../ui/classes';
import { EDIT_ALL_PROBLEM, lockNotice } from './field-lock';
import type { ProblemForm } from './problem-form';

const form = defineModel<ProblemForm>({ required: true });
const props = defineProps<{ meta: ProblemEditingMeta; errors: FieldErrors }>();
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
const typeNameOf = (typeId: string) =>
  props.meta.types.find((type) => type.id === typeId)?.fullName ?? typeId;

function addType() {
  if (!pickedTypeId.value) return;
  form.value.typeIds.push(pickedTypeId.value);
  pickedTypeId.value = '';
}

function removeType(typeId: string) {
  form.value.typeIds = form.value.typeIds.filter((id) => id !== typeId);
}

function setLanguageAllowed(languageId: string, isAllowed: boolean) {
  const others = form.value.allowedLanguages.filter((id) => id !== languageId);
  form.value.allowedLanguages = isAllowed ? [...others, languageId] : others;
}
</script>

<template>
  <SettingsCard :title="$t('admin.problems.general.sections.classes')">
    <div class="grid gap-5 sm:grid-cols-2">
      <AdminField
        v-slot="{ id, describedBy }"
        input-id="problem-group"
        :label="$t('admin.problems.general.classes.group')"
      >
        <select
          :id="id"
          v-model="form.groupId"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
        >
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
          :class="ADMIN_INPUT_CLASS"
          :disabled="isStaffLocked"
          :aria-describedby="describedBy"
        >
          <option value="">{{ $t('admin.problems.general.classes.noLicense') }}</option>
          <option v-for="license in meta.licenses" :key="license.id" :value="license.id">
            {{ license.name }}
          </option>
        </select>
      </AdminField>
    </div>

    <div class="flex flex-col gap-3">
      <h3 class="text-sm font-semibold">{{ $t('admin.problems.general.classes.types') }}</h3>
      <ul class="flex flex-wrap gap-2">
        <li
          v-for="typeId in form.typeIds"
          :key="typeId"
          class="flex items-center gap-2 rounded-pill border border-line-strong px-3 py-1 text-sm"
        >
          {{ typeNameOf(typeId) }}
          <button
            type="button"
            class="min-h-11 px-1 font-semibold"
            :aria-label="$t('admin.ui.removeChip', { name: typeNameOf(typeId) })"
            @click="removeType(typeId)"
          >
            ×
          </button>
        </li>
      </ul>
      <p v-if="errors.typeIds" class="text-sm text-negative">{{ errors.typeIds }}</p>
      <div v-if="unpickedTypes.length > 0" class="flex flex-wrap items-end gap-2">
        <label class="flex min-w-60 flex-1 flex-col gap-1.5 text-sm font-semibold">
          {{ $t('admin.problems.general.classes.pickType') }}
          <select id="problem-type-pick" v-model="pickedTypeId" :class="ADMIN_INPUT_CLASS">
            <option value="">{{ $t('admin.problems.general.classes.pickType') }}</option>
            <option v-for="type in unpickedTypes" :key="type.id" :value="type.id">
              {{ type.fullName }}
            </option>
          </select>
        </label>
        <button type="button" :class="ADMIN_BUTTON_CLASS" @click="addType">
          {{ $t('admin.problems.general.classes.addType') }}
        </button>
      </div>
    </div>

    <fieldset
      class="flex flex-col gap-2"
      :aria-describedby="isStaffLocked ? allowedLanguagesLockId : undefined"
    >
      <legend class="text-sm font-semibold">
        {{ $t('admin.problems.general.classes.allowedLanguages') }}
      </legend>
      <label
        v-for="language in meta.languages"
        :key="language.id"
        class="flex min-h-11 items-center gap-3"
      >
        <input
          type="checkbox"
          class="size-5"
          :checked="form.allowedLanguages.includes(language.id)"
          :disabled="isStaffLocked"
          @change="setLanguageAllowed(language.id, ($event.target as HTMLInputElement).checked)"
        />
        {{ language.name }}
      </label>
      <p v-if="isStaffLocked" :id="allowedLanguagesLockId" class="text-xs text-muted">
        {{ lockNotice(isStaffLocked) }}
      </p>
    </fieldset>
  </SettingsCard>
</template>
