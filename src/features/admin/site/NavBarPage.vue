<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import QueryState from '@/components/QueryState.vue';
import SettingsNotice from '@/features/account/settings/SettingsNotice.vue';
import { ApiError } from '@/api/client';
import { deleteNavItem } from '@/api/site-admin.api';
import type { NavigationItem } from '@/api/types/site-admin';
import { translate } from '@/i18n';
import AdminBit from '../shell/AdminBit.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { ADMIN_BUTTON_CLASS, ADMIN_DANGER_CLASS, ADMIN_PRIMARY_CLASS } from '../ui/classes';
import { useAdminMutation } from '../ui/use-admin-mutation';
import NavItemDialog from './NavItemDialog.vue';
import { navRows } from './nav-tree';
import { useSiteAdminQuery, writeNavigation } from './site.queries';

const query = useSiteAdminQuery();
const queryClient = useQueryClient();
const items = computed(() => query.data.value?.navigation ?? []);
const rows = computed(() => navRows(items.value));

const isEditorOpen = ref(false);
const editingItem = ref<NavigationItem | null>(null);
const isDeleteOpen = ref(false);
const deleteTarget = ref<NavigationItem | null>(null);
const refusedId = ref<string | null>(null);
const savedText = ref<string | null>(null);

const remove = useAdminMutation({
  mutate: (id: string) => deleteNavItem(id),
  onDone: (_result, id) => writeNavigation(queryClient, { deletedId: id }),
});

/** A refused delete of an entry with children says why; any other failure reads as usual. */
const refusalText = (error: unknown) =>
  error instanceof ApiError && error.code === 'conflict'
    ? translate('admin.site.nav.hasChildren')
    : failureTextOf(error);

function openEditor(item: NavigationItem | null) {
  editingItem.value = item;
  savedText.value = null;
  isEditorOpen.value = true;
}

function askDelete(item: NavigationItem) {
  deleteTarget.value = item;
  refusedId.value = null;
  isDeleteOpen.value = true;
}

async function confirmDelete() {
  const target = deleteTarget.value;
  if (!target) return;
  await remove.run(target.id);
  isDeleteOpen.value = false;
  if (remove.failure.value) refusedId.value = target.id;
  else savedText.value = translate('admin.site.nav.deleted', { label: target.label });
}

const parentLabelOf = (item: NavigationItem) =>
  items.value.find((candidate) => candidate.id === item.parentId)?.label ?? '';
</script>

<template>
  <div class="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 py-6 sm:px-8">
    <AdminPageHeader
      :crumbs="[{ label: $t('admin.site.nav.crumbs') }, { label: $t('admin.site.nav.title') }]"
      :title="$t('admin.site.nav.title')"
    >
      <template #actions>
        <button type="button" :class="ADMIN_PRIMARY_CLASS" @click="openEditor(null)">
          {{ $t('admin.site.nav.add') }}
        </button>
      </template>
    </AdminPageHeader>

    <p class="text-sm text-muted">{{ $t('admin.site.nav.treeNote') }}</p>
    <AdminStatus v-if="savedText" kind="done" :text="savedText" />

    <QueryState
      :loading="query.isPending.value"
      :error="query.error.value"
      @retry="query.refetch()"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="text-muted">
            <tr>
              <th scope="col" class="px-2 py-2 font-semibold">
                {{ $t('admin.site.nav.columns.item') }}
              </th>
              <th scope="col" class="hidden px-2 py-2 font-semibold sm:table-cell">
                {{ $t('admin.site.nav.columns.regex') }}
              </th>
              <th scope="col" class="hidden px-2 py-2 font-semibold sm:table-cell">
                {{ $t('admin.site.nav.columns.order') }}
              </th>
              <th scope="col" class="px-2 py-2 font-semibold">
                {{ $t('admin.site.nav.columns.actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.item.id" class="border-t border-line align-top">
              <td class="px-2 py-2">
                <div
                  class="flex flex-col gap-0.5"
                  :style="{ paddingLeft: `${row.depth * 1.25}rem` }"
                >
                  <span class="flex flex-wrap items-center gap-2 font-semibold">
                    <span v-if="row.depth > 0" aria-hidden="true" class="text-muted">└</span>
                    {{ row.item.label }}
                    <span class="rounded-pill bg-surface-hover px-2 font-mono text-xs">{{
                      row.item.key
                    }}</span>
                    <span v-if="row.item.hidden" class="rounded-pill bg-surface-hover px-2 text-xs">
                      {{ $t('admin.site.nav.hidden') }}
                    </span>
                  </span>
                  <span class="font-mono text-xs text-muted">{{ row.item.path }}</span>
                  <span v-if="row.depth > 0" class="sr-only">
                    {{ $t('admin.site.nav.childOf', { parent: parentLabelOf(row.item) }) }}
                  </span>
                  <span
                    v-if="row.regexError"
                    class="flex flex-wrap items-start gap-2 text-negative"
                  >
                    <AdminBit placement="refused" />
                    {{ $t('admin.site.nav.regexBroken', { message: row.regexError }) }}
                  </span>
                </div>
              </td>
              <td class="hidden px-2 py-2 font-mono text-xs sm:table-cell">
                {{ row.item.regex || $t('admin.site.nav.noRegex') }}
              </td>
              <td class="hidden px-2 py-2 tabular-nums sm:table-cell">{{ row.item.order }}</td>
              <td class="px-2 py-2">
                <div class="flex flex-wrap gap-2">
                  <button type="button" :class="ADMIN_BUTTON_CLASS" @click="openEditor(row.item)">
                    {{ $t('admin.site.nav.edit') }}
                  </button>
                  <button type="button" :class="ADMIN_DANGER_CLASS" @click="askDelete(row.item)">
                    {{ $t('admin.site.nav.delete') }}
                  </button>
                </div>
                <AdminStatus
                  v-if="refusedId === row.item.id && remove.failure.value"
                  kind="refused"
                  :text="refusalText(remove.failure.value)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </QueryState>

    <SettingsNotice tone="info">
      <strong>{{ $t('admin.site.nav.infoTitle') }}</strong> — {{ $t('admin.site.nav.info') }}
    </SettingsNotice>

    <NavItemDialog
      v-model:visible="isEditorOpen"
      :item="editingItem"
      :items="items"
      @saved="(item) => (savedText = $t('admin.site.nav.saved', { label: item.label }))"
    />

    <ConfirmDialog
      v-model:visible="isDeleteOpen"
      tone="danger"
      :title="$t('admin.site.nav.deleteTitle', { label: deleteTarget?.label ?? '' })"
      :body="$t('admin.site.nav.deleteBody')"
      :confirm-label="$t('admin.site.nav.deleteConfirm')"
      :busy="remove.isPending.value"
      @confirm="confirmDelete"
    />
  </div>
</template>
