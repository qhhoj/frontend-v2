<script setup lang="ts">
import { computed } from 'vue';
import { createTaxon, updateTaxon } from '@/api/problem-catalogs.api';
import type { TaxonAdmin, TaxonKind } from '@/api/types/problem-catalogs';
import { usePermissions } from '@/stores/use-permissions';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { INPUT, buttonClass } from '../ui/controls';
import AdminSaveBar from '../ui/form/AdminSaveBar.vue';
import { checkTaxonForm, emptyTaxonForm, taxonFormOf } from './catalog-forms';
import { META_KEYS, taxaKey } from './catalogs.queries';
import { useCatalogEditor } from './use-catalog-editor';

/** The drawer body that creates (`row` null) or edits one problem type or group; `done` after a save, `cancel` to close. */
const props = defineProps<{ kind: TaxonKind; row: TaxonAdmin | null }>();
const emit = defineEmits<{ done: []; cancel: [] }>();
const { can } = usePermissions();
const ADD_PERMISSION = {
  'problem-types': 'judge.add_problemtype',
  'problem-groups': 'judge.add_problemgroup',
} as const;
const { form, isCreate, dirtyCount, errors, mutation, isTaken, save, discard } = useCatalogEditor({
  row: () => props.row,
  empty: emptyTaxonForm,
  formOf: taxonFormOf,
  check: checkTaxonForm,
  create: (sent) => createTaxon(props.kind, sent),
  update: (row, patch) => updateTaxon(props.kind, row.id, patch),
  invalidates: [taxaKey(props.kind), ...META_KEYS],
  uniqueField: 'name',
  nameOf: (sent) => sent.fullName,
  onDone: () => emit('done'),
});
const canWrite = computed(() => !isCreate.value || can(ADD_PERMISSION[props.kind]));
const idPrefix = computed(() => `catalog-${props.kind}`);
</script>

<template>
  <div class="flex flex-col gap-4">
    <p v-if="!canWrite" class="text-sm text-muted">{{ $t('admin.catalogs.noAdd') }}</p>
    <form v-else class="flex flex-col gap-4" novalidate @submit.prevent="save">
      <AdminField
        :input-id="`${idPrefix}-name`"
        :label="$t('admin.catalogs.fields.name')"
        :hint="$t('admin.catalogs.hints.name')"
        :error="errors.name"
      >
        <template #default="{ id, describedBy, invalid }">
          <input
            :id="id"
            v-model="form.name"
            maxlength="20"
            autocomplete="off"
            autofocus
            :class="[INPUT, 'font-mono']"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
          />
        </template>
      </AdminField>
      <AdminField
        :input-id="`${idPrefix}-full-name`"
        :label="$t('admin.catalogs.fields.fullName')"
        :error="errors.fullName"
      >
        <template #default="{ id, describedBy, invalid }">
          <input
            :id="id"
            v-model="form.fullName"
            maxlength="100"
            :class="INPUT"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
          />
        </template>
      </AdminField>
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
