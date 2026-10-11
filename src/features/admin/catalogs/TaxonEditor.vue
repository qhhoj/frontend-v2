<script setup lang="ts">
import { computed } from 'vue';
import { createTaxon, updateTaxon } from '@/api/problem-catalogs.api';
import type { TaxonAdmin, TaxonKind } from '@/api/types/problem-catalogs';
import { usePermissions } from '@/stores/use-permissions';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { ADMIN_BUTTON_CLASS, ADMIN_INPUT_CLASS, ADMIN_PRIMARY_CLASS } from '../ui/classes';
import { checkTaxonForm, emptyTaxonForm, taxonFormOf } from './catalog-forms';
import { META_KEYS, taxaKey } from './catalogs.queries';
import { useCatalogEditor } from './use-catalog-editor';

/** Create (`row` null) or edit one problem type or group; `done` leaves edit mode. */
const props = defineProps<{ kind: TaxonKind; row: TaxonAdmin | null }>();
const emit = defineEmits<{ done: [] }>();
const { can } = usePermissions();
const ADD_PERMISSION = {
  'problem-types': 'judge.add_problemtype',
  'problem-groups': 'judge.add_problemgroup',
} as const;
const { form, isCreate, errors, mutation, isTaken, save } = useCatalogEditor({
  row: () => props.row,
  empty: emptyTaxonForm,
  formOf: taxonFormOf,
  check: checkTaxonForm,
  create: (sent) => createTaxon(props.kind, sent),
  update: (row, patch) => updateTaxon(props.kind, row.id, patch),
  invalidates: [taxaKey(props.kind), ...META_KEYS],
  uniqueField: 'name',
  onDone: () => emit('done'),
});
const canWrite = computed(() => !isCreate.value || can(ADD_PERMISSION[props.kind]));
const idPrefix = computed(() => `catalog-${props.kind}`);
</script>

<template>
  <section class="glass flex flex-col gap-4 rounded-panel p-5">
    <h2 class="font-display text-base font-bold">
      {{
        row
          ? $t('admin.catalogs.editTitle', { name: row.fullName })
          : $t(`admin.catalogs.${kind}.createTitle`)
      }}
    </h2>
    <p v-if="!canWrite" class="text-sm text-muted">{{ $t('admin.catalogs.noAdd') }}</p>
    <form v-else class="grid gap-4 md:grid-cols-2" novalidate @submit.prevent="save">
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
            :class="[ADMIN_INPUT_CLASS, 'font-mono']"
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
            :class="ADMIN_INPUT_CLASS"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
          />
        </template>
      </AdminField>
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
