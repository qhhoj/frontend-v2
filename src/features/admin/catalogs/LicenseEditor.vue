<script setup lang="ts">
import { computed } from 'vue';
import { createLicense, updateLicense } from '@/api/problem-catalogs.api';
import type { LicenseAdmin } from '@/api/types/problem-catalogs';
import { usePermissions } from '@/stores/use-permissions';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import MarkdownField from '../ui/MarkdownField.vue';
import { failureTextOf } from '../ui/admin-errors';
import { INPUT, buttonClass } from '../ui/controls';
import AdminSaveBar from '../ui/form/AdminSaveBar.vue';
import { checkLicenseForm, emptyLicenseForm, licenseFormOf } from './catalog-forms';
import type { LicenseForm } from './catalog-forms';
import { LICENSES_ADMIN_KEY, META_KEYS } from './catalogs.queries';
import { useCatalogEditor } from './use-catalog-editor';

/** The drawer body that creates (`row` null) or edits one license, with a markdown preview; `done` after a save, `cancel` to close. */
const props = defineProps<{ row: LicenseAdmin | null }>();
const emit = defineEmits<{ done: []; cancel: [] }>();
const { can } = usePermissions();
const { form, isCreate, dirtyCount, errors, mutation, isTaken, save, discard } = useCatalogEditor({
  row: () => props.row,
  empty: emptyLicenseForm,
  formOf: licenseFormOf,
  check: checkLicenseForm,
  create: createLicense,
  update: (row, patch) => updateLicense(row.id, patch),
  invalidates: [LICENSES_ADMIN_KEY, ...META_KEYS],
  uniqueField: 'key',
  nameOf: (sent) => sent.name,
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
  <div class="flex flex-col gap-4">
    <p v-if="!canWrite" class="text-sm text-muted">{{ $t('admin.catalogs.noAdd') }}</p>
    <form v-else class="flex flex-col gap-4" novalidate @submit.prevent="save">
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
            :autofocus="input.field === 'key'"
            :class="[INPUT, input.mono ? 'font-mono' : '']"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
          />
        </template>
      </AdminField>
      <div>
        <MarkdownField
          v-model="form.text"
          :label="$t('admin.catalogs.fields.text')"
          preview-style="problem"
          :error="errors.text"
        />
      </div>
      <div class="flex border-t border-line pt-4">
        <AdminSaveBar
          variant="footer"
          :dirty-count="dirtyCount"
          :pending="mutation.isPending.value"
          :allow-clean="isCreate"
          :save-label="isCreate ? $t('admin.catalogs.create') : $t('admin.catalogs.save')"
          @discard="discard"
        >
          <template #actions>
            <button type="button" :class="buttonClass('ghost')" @click="emit('cancel')">
              {{ $t('common.close') }}
            </button>
          </template>
        </AdminSaveBar>
      </div>
    </form>
    <AdminStatus
      v-if="mutation.failure.value && !isTaken"
      kind="refused"
      :text="failureTextOf(mutation.failure.value)"
    />
  </div>
</template>
