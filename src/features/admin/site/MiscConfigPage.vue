<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import QueryState from '@/components/QueryState.vue';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import SettingsNotice from '@/features/account/settings/SettingsNotice.vue';
import { translate } from '@/i18n';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import { ADMIN_PRIMARY_CLASS } from '../ui/classes';
import { ADMIN_BIT_KINDS } from '../shell/admin-bit';
import ConfigEditor from './ConfigEditor.vue';
import { configKindOf } from './config-kinds';
import type { ConfigKind } from './config-kinds';
import { useSiteAdminQuery } from './site.queries';

interface ConfigRow {
  key: string;
  value: string;
  kind: ConfigKind;
  length: number;
}
/** `isNew` opens the empty form for a key that does not exist yet. */
interface EditTarget {
  key: string;
  isNew: boolean;
}

const query = useSiteAdminQuery();
const editing = ref<EditTarget | null>(null);
const config = computed(() => query.data.value?.config ?? {});
const takenKeys = computed(() => Object.keys(config.value));

const rows = computed<ConfigRow[]>(() =>
  Object.entries(config.value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => ({ key, value, kind: configKindOf(key, value), length: value.length })),
);

const editorTitle = computed(() =>
  editing.value?.isNew
    ? translate('admin.site.config.newHeading')
    : translate('admin.site.config.editHeading', { key: editing.value?.key ?? '' }),
);
const editorValue = computed(() =>
  editing.value && !editing.value.isNew ? (config.value[editing.value.key] ?? '') : '',
);

const deletedText = ref('');
const editRow = (key: string) => {
  deletedText.value = '';
  editing.value = { key, isNew: false };
};
const addKey = () => {
  deletedText.value = '';
  editing.value = { key: '', isNew: true };
};
const closeEditor = () => (editing.value = null);

/** The editor and its delete dialog unmount with the deleted key, so the result lives in a standing status region. */
const addButton = ref<HTMLButtonElement | null>(null);

/** A deleted key leaves no row to return to: say so in the standing region and move focus to the add button. */
function onDeleted(key: string) {
  deletedText.value = translate('admin.site.config.deleted', { key });
  closeEditor();
  void nextTick(() => addButton.value?.focus());
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-[1280px] flex-col gap-6">
    <AdminPageHeader :title="$t('admin.site.config.title')">
      <template #actions>
        <button ref="addButton" type="button" :class="ADMIN_PRIMARY_CLASS" @click="addKey">
          {{ $t('admin.site.config.add') }}
        </button>
      </template>
    </AdminPageHeader>

    <p role="status" class="sr-only">{{ deletedText }}</p>
    <p v-if="deletedText" aria-hidden="true" class="text-sm font-semibold text-positive">
      {{ deletedText }}
    </p>

    <SettingsNotice tone="warning" :bit="ADMIN_BIT_KINDS.security">
      {{ $t('admin.site.config.warning') }}
    </SettingsNotice>

    <QueryState
      :loading="query.isPending.value"
      :error="query.error.value"
      @retry="query.refetch()"
    >
      <div class="grid gap-6 lg:grid-cols-2 lg:items-start">
        <SettingsCard :title="$t('admin.site.config.title')">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="text-muted">
                <tr>
                  <th scope="col" class="px-2 py-2 font-semibold">
                    {{ $t('admin.site.config.columns.key') }}
                  </th>
                  <th scope="col" class="px-2 py-2 font-semibold">
                    {{ $t('admin.site.config.columns.value') }}
                  </th>
                  <th scope="col" class="px-2 py-2 font-semibold">
                    {{ $t('admin.site.config.columns.kind') }}
                  </th>
                  <th scope="col" class="px-2 py-2 font-semibold">
                    {{ $t('admin.site.config.columns.length') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in rows" :key="row.key" class="border-t border-line">
                  <td class="px-2 py-2">
                    <button
                      type="button"
                      class="font-mono font-semibold hover:underline"
                      @click="editRow(row.key)"
                    >
                      {{ row.key }}
                    </button>
                  </td>
                  <td class="max-w-[260px] truncate px-2 py-2 font-mono text-xs">
                    {{ row.value }}
                  </td>
                  <td class="px-2 py-2">{{ $t(`admin.site.config.kinds.${row.kind}`) }}</td>
                  <td class="px-2 py-2 tabular-nums">{{ row.length }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted">{{ $t('admin.site.config.listNote') }}</p>
        </SettingsCard>

        <SettingsCard v-if="editing" :title="editorTitle">
          <ConfigEditor
            :key="`${editing.key}:${editing.isNew}`"
            :config-key="editing.key"
            :is-new="editing.isNew"
            :initial-value="editorValue"
            :taken-keys="takenKeys"
            @close="closeEditor"
            @deleted="onDeleted"
          />
        </SettingsCard>
      </div>
    </QueryState>
  </div>
</template>
