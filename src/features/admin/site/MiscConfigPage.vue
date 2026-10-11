<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { translate } from '@/i18n';
import { SITE_NOTICE_KEY } from '@/features/site-notice/site-notice';
import AdminChip from '../ui/AdminChip.vue';
import AdminDrawer from '../ui/AdminDrawer.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import { BUTTON, CARD, buttonClass } from '../ui/controls';
import AdminNotice from '../ui/feedback/AdminNotice.vue';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import type { AdminColumn } from '../ui/table/table-columns';
import ConfigEditor from './ConfigEditor.vue';
import SiteNoticeCard from './SiteNoticeCard.vue';
import { configKindOf } from './config-kinds';
import { KNOWN_CONFIG_KEYS, knownConfigKey } from './config-registry';
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

const { t } = useI18n();
const query = useSiteAdminQuery();
const editing = ref<EditTarget | null>(null);
const config = computed(() => query.data.value?.config ?? {});
const takenKeys = computed(() => Object.keys(config.value));

const rows = computed<ConfigRow[]>(() =>
  Object.entries(config.value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => ({ key, value, kind: configKindOf(key, value), length: value.length })),
);
const columns = computed<AdminColumn[]>(() => [
  {
    key: 'key',
    label: t('admin.site.config.columns.key'),
    priority: 'primary',
    cellClass: 'min-w-56',
  },
  { key: 'kind', label: t('admin.site.config.columns.kind'), priority: 'badge' },
  { key: 'value', label: t('admin.site.config.columns.value'), cellClass: 'w-full' },
  { key: 'length', label: t('admin.site.config.columns.length'), align: 'end' },
]);

const editorTitle = computed(() =>
  editing.value?.isNew
    ? translate('admin.site.config.newHeading')
    : translate('admin.site.config.editHeading', { key: editing.value?.key ?? '' }),
);
const editorValue = computed(() =>
  editing.value && !editing.value.isNew ? (config.value[editing.value.key] ?? '') : '',
);
const isEditorOpen = computed({
  get: () => editing.value !== null,
  set: (isOpen: boolean) => {
    if (!isOpen) editing.value = null;
  },
});

const deletedText = ref('');
const editRow = (key: string) => {
  deletedText.value = '';
  editing.value = { key, isNew: false };
};
const addKey = (key = '') => {
  deletedText.value = '';
  editing.value = { key, isNew: true };
};
/** Known keys with no value yet: one click opens the new-key form with the key filled in. */
const unsetKnown = computed(() =>
  KNOWN_CONFIG_KEYS.filter(({ key }) => !(key in config.value) && key !== SITE_NOTICE_KEY),
);
const notice = computed(() => config.value[SITE_NOTICE_KEY] ?? null);
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
  <div class="flex w-full flex-col gap-6">
    <AdminPageHeader :title="$t('admin.site.config.title')" :lead="$t('admin.site.config.lead')">
      <template #actions>
        <button ref="addButton" type="button" :class="BUTTON.primary" @click="addKey()">
          {{ $t('admin.site.config.add') }}
        </button>
      </template>
    </AdminPageHeader>

    <p role="status" class="sr-only">{{ deletedText }}</p>

    <AdminNotice
      tone="caution"
      :title="$t('admin.site.config.warning.title')"
      :summary="$t('admin.site.config.warning.summary')"
    >
      <p class="m-0">{{ $t('admin.site.config.warning.html') }}</p>
      <p class="m-0">{{ $t('admin.site.config.warning.tracking') }}</p>
    </AdminNotice>

    <SiteNoticeCard v-if="query.data.value" :current="notice" />

    <div class="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <AdminDataTable
        :columns="columns"
        :rows="rows"
        :row-key="(row) => row.key"
        :row-attrs="(row) => ({ 'data-key': row.key })"
        :label="$t('admin.site.config.caption')"
        :loading="query.isPending.value"
        :error="query.error.value"
        :skeleton-rows="6"
        @retry="query.refetch()"
      >
        <template #cell-key="{ row }">
          <button
            type="button"
            class="rounded-cell text-left font-mono font-semibold text-accent-text hover:underline"
            @click="editRow(row.key)"
          >
            {{ row.key }}
          </button>
          <span
            v-if="knownConfigKey(row.key)"
            class="block text-xs"
            :class="knownConfigKey(row.key)!.isUsed ? 'text-positive' : 'text-muted'"
          >
            {{
              knownConfigKey(row.key)!.isUsed
                ? $t('admin.site.config.usedChip')
                : $t('admin.site.config.unusedChip')
            }}
          </span>
        </template>
        <template #cell-kind="{ row }">
          <AdminChip :tone="row.kind === 'text' ? 'neutral' : 'info'">
            {{ $t(`admin.site.config.kinds.${row.kind}`) }}
          </AdminChip>
        </template>
        <template #cell-value="{ row }">
          <span
            class="block max-w-[14rem] truncate font-mono text-xs sm:max-w-md lg:max-w-xl"
            :title="row.value"
          >
            {{ row.value || $t('admin.site.config.history.emptyValue') }}
          </span>
        </template>
      </AdminDataTable>

      <section
        v-if="unsetKnown.length"
        :class="[CARD, 'flex flex-col gap-3 p-4']"
        aria-labelledby="config-known-title"
      >
        <h2 id="config-known-title" class="font-display text-base font-semibold">
          {{ $t('admin.site.config.knownHeading') }}
        </h2>
        <ul class="m-0 flex list-none flex-col gap-3 p-0">
          <li v-for="entry in unsetKnown" :key="entry.key" class="flex items-start gap-3">
            <div class="min-w-0 flex-1">
              <span class="font-mono text-sm font-semibold break-all">{{ entry.key }}</span>
              <span class="block text-xs text-muted">{{
                $t(`admin.site.config.known.${entry.key}`)
              }}</span>
            </div>
            <button
              type="button"
              :class="buttonClass('secondary', 'sm')"
              :aria-label="$t('admin.site.config.setKnownLabel', { key: entry.key })"
              @click="addKey(entry.key)"
            >
              {{ $t('admin.site.config.setKnown') }}
            </button>
          </li>
        </ul>
      </section>
    </div>

    <AdminDrawer v-model:visible="isEditorOpen" :title="editorTitle">
      <ConfigEditor
        v-if="editing"
        :key="`${editing.key}:${editing.isNew}`"
        :config-key="editing.key"
        :is-new="editing.isNew"
        :initial-value="editorValue"
        :taken-keys="takenKeys"
        @close="closeEditor"
        @deleted="onDeleted"
      />
    </AdminDrawer>
  </div>
</template>
