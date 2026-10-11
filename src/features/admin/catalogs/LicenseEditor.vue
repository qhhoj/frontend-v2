<script setup lang="ts">
import { computed } from 'vue';
import { createLicense, updateLicense } from '@/api/problem-catalogs.api';
import type { LicenseAdmin } from '@/api/types/problem-catalogs';
import { usePermissions } from '@/stores/use-permissions';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import MarkdownField from '../ui/MarkdownField.vue';
import { failureTextOf } from '../ui/admin-errors';
import { ADMIN_BUTTON_CLASS, ADMIN_INPUT_CLASS, ADMIN_PRIMARY_CLASS } from '../ui/classes';
import { checkLicenseForm, emptyLicenseForm, licenseFormOf } from './catalog-forms';
import type { LicenseForm } from './catalog-forms';
import { LICENSES_ADMIN_KEY, META_KEYS } from './catalogs.queries';
import { useCatalogEditor } from './use-catalog-editor';

/** Create (`row` null) or edit one license; the text has a live markdown preview. */
const props = defineProps<{ row: LicenseAdmin | null }>();
const emit = defineEmits<{ done: [] }>();
const { can } = usePermissions();
const { form, isCreate, errors, mutation, isTaken, save } = useCatalogEditor({
  row: () => props.row,
  empty: emptyLicenseForm,
  formOf: licenseFormOf,
  check: checkLicenseForm,
  create: createLicense,
  update: (row, patch) => updateLicense(row.id, patch),
  invalidates: [LICENSES_ADMIN_KEY, ...META_KEYS],
  uniqueField: 'key',
  onDone: () => emit('done'),
});
const canWrite = computed(() => !isCreate.value || can('judge.add_license'));
const TEXT_FIELDS = [
  { field: 'key', maxlength: 20, mono: true },
  { field: 'name', maxlength: 256, mono: false },
  { field: 'display', maxlength: 256, mono: false },
  { field: 'link', maxlength: 200, mono: true },
  { field: 'icon', maxlength: 200, mono: true },
] as const satisfies readonly { field: keyof LicenseForm; maxlength: number; mono: boolean }[];
</script>

<template>
  <section class="glass flex flex-col gap-4 rounded-panel p-5">
    <h2 class="font-display text-base font-bold">
      {{
        row
          ? $t('admin.catalogs.editTitle', { name: row.name })
          : $t('admin.catalogs.licenses.createTitle')
      }}
    </h2>
    <p v-if="!canWrite" class="text-sm text-muted">{{ $t('admin.catalogs.noAdd') }}</p>
    <form v-else class="grid gap-4 md:grid-cols-2" novalidate @submit.prevent="save">
      <AdminField
        v-for="input in TEXT_FIELDS"
        :key="input.field"
        :input-id="`catalog-license-${input.field}`"
        :label="$t(`admin.catalogs.fields.${input.field}`)"
        :hint="$t(`admin.catalogs.hints.${input.field}`)"
        :error="errors[input.field]"
      >
        <template #default="{ id, describedBy, invalid }">
          <input
            :id="id"
            v-model="form[input.field]"
            :maxlength="input.maxlength"
            autocomplete="off"
            :class="[ADMIN_INPUT_CLASS, input.mono ? 'font-mono' : '']"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
          />
        </template>
      </AdminField>
      <div class="md:col-span-2">
        <MarkdownField
          v-model="form.text"
          :label="$t('admin.catalogs.fields.text')"
          preview-style="problem"
          :error="errors.text"
        />
      </div>
      <div class="flex flex-wrap items-center gap-3 md:col-span-2">
        <button
          type="submit"
          :class="ADMIN_PRIMARY_CLASS"
          :aria-busy="mutation.isPending.value || undefined"
        >
          {{ isCreate ? $t('admin.catalogs.create') : $t('admin.catalogs.save') }}
        </button>
        <button v-if="!isCreate" type="button" :class="ADMIN_BUTTON_CLASS" @click="emit('done')">
          {{ $t('admin.catalogs.cancel') }}
        </button>
      </div>
    </form>
    <AdminStatus v-if="mutation.isDone.value" kind="done" :text="$t('admin.ui.saved')" />
    <AdminStatus
      v-if="mutation.failure.value && !isTaken"
      kind="refused"
      :text="failureTextOf(mutation.failure.value)"
    />
  </section>
</template>
