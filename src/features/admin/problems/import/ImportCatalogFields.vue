<script setup lang="ts">
import { computed } from 'vue';
import { problemTypeLabel } from '@/features/problems/problem-type-label';
import { useProblemEditingMetaQuery } from '../problem-editing.queries';
import FormField from '@/components/ui/FormField.vue';
import SelectField from '@/components/ui/SelectField.vue';
import TextInput from '@/components/ui/TextInput.vue';
import AdminCheckChips from '../../ui/AdminCheckChips.vue';
import UsernameChips from '../../ui/UsernameChips.vue';
import { POINTS_MIN } from './import-form';
import type { ImportForm } from './import-form';

/**
 * The QHHOJ catalog fields of an import: group, points, types, authors and curators. Each hint says what an empty field
 * means: the defaults on create, the stored value on update (the server leaves an absent field as it is). Points is a text
 * input with a numeric keyboard: `type="number"` would make `v-model` store a number in the string field.
 */
const form = defineModel<ImportForm>('form', { required: true });
defineProps<{ errorOf: (field: string) => string | undefined }>();
const { data: meta } = useProblemEditingMetaQuery();
const groups = computed(() => meta.value?.groups ?? []);
const typeOptions = computed(() =>
  (meta.value?.types ?? []).map((type) => ({ value: type.id, label: problemTypeLabel(type) })),
);
const isUpdate = computed(() => form.value.mode === 'update');
</script>

<template>
  <div class="grid gap-5 @lg:grid-cols-2">
    <FormField scale="admin" :label="$t('admin.polygon.form.group')" :error="errorOf('groupId')">
      <SelectField
        v-model="form.groupId"
        :placeholder="
          $t(isUpdate ? 'admin.polygon.form.groupKeep' : 'admin.polygon.form.groupDefault')
        "
      >
        <option v-for="group in groups" :key="group.id" :value="group.id">
          {{ group.fullName }}
        </option>
      </SelectField>
    </FormField>

    <FormField
      scale="admin"
      :label="$t('admin.polygon.form.points')"
      :hint="
        isUpdate
          ? $t('admin.polygon.form.keepHint')
          : $t('admin.polygon.form.pointsHint', { points: POINTS_MIN })
      "
      :error="errorOf('points')"
    >
      <TextInput
        v-model="form.points"
        inputmode="numeric"
        autocomplete="off"
        class="font-mono"
        :placeholder="isUpdate ? undefined : String(POINTS_MIN)"
      />
    </FormField>

    <fieldset class="flex flex-col gap-2 @lg:col-span-2">
      <legend class="mb-1.5 text-sm font-semibold">{{ $t('admin.polygon.form.types') }}</legend>
      <p class="text-sm text-muted">
        {{ $t(isUpdate ? 'admin.polygon.form.keepHint' : 'admin.polygon.form.typesHint') }}
      </p>
      <p v-if="errorOf('typeIds')" class="text-sm text-negative">{{ errorOf('typeIds') }}</p>
      <AdminCheckChips v-model="form.typeIds" :options="typeOptions" name="import-types" />
    </fieldset>

    <UsernameChips
      v-model="form.authors"
      :label="$t('admin.polygon.form.authors')"
      :error="errorOf('authors')"
    />
    <UsernameChips
      v-model="form.curators"
      :label="$t('admin.polygon.form.curators')"
      :error="errorOf('curators')"
    />
  </div>
</template>
