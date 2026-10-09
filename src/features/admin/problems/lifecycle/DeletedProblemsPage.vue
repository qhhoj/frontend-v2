<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { DeletedProblem } from '@/api/types/problem-lifecycle';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { actorName } from '@/lib/actor';
import { formatNumericDateTime } from '@/lib/format';
import { pageFromQuery } from '@/lib/paging';
import { useLocaleStore } from '@/stores/locale.store';
import { usePermissions } from '@/stores/use-permissions';
import AdminBit from '../../shell/AdminBit.vue';
import AdminPageHeader from '../../ui/AdminPageHeader.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { ADMIN_BUTTON_CLASS, ADMIN_DANGER_CLASS } from '../../ui/classes';
import { graceTextOf } from './days-left';
import { useDeletedProblemsQuery } from './lifecycle.queries';
import ProblemsIndexTabs from './ProblemsIndexTabs.vue';
import TypedCodeDialog from './TypedCodeDialog.vue';
import { useDeletedActions } from './use-deleted-actions';

const SKELETON_ROWS = 3;
const route = useRoute();
const locale = useLocaleStore();
const page = computed(() => pageFromQuery(route.query.page));
const { data, isPending, error, refetch } = useDeletedProblemsQuery(page);
const { isSuperuser } = usePermissions();
const { restore, purge, outcome, restoreRow, openPurgeFor } = useDeletedActions();
const purging = ref<DeletedProblem | null>(null);
const isPurgeOpen = computed({
  get: () => purging.value !== null,
  set: (isOpen: boolean) => {
    if (!isOpen) purging.value = null;
  },
});
const purgeFailure = computed(() =>
  purge.failure.value ? failureTextOf(purge.failure.value) : '',
);

function openPurge(row: DeletedProblem) {
  openPurgeFor();
  purging.value = row;
}
async function confirmPurge(typed: string) {
  if (!purging.value) return;
  const result = await purge.run({ code: purging.value.code, confirmCode: typed });
  if (result) purging.value = null;
}
const CELL = 'py-2 pr-3 align-middle';
const HEAD = 'whitespace-nowrap py-2 pr-3 align-middle';
</script>

<template>
  <div class="flex flex-col gap-5 px-4 py-6 sm:px-8">
    <AdminPageHeader
      :crumbs="[
        { label: $t('admin.shell.groups.content') },
        { label: $t('admin.shell.screens.problems'), to: { name: 'admin-problems' } },
      ]"
      :title="$t('admin.shell.screens.problemsDeleted')"
      :lead="$t('admin.lifecycle.deletedLead')"
    />
    <ProblemsIndexTabs />
    <AdminStatus v-if="outcome" :kind="outcome.kind" :text="outcome.text" />
    <section data-testid="deleted-problems" class="glass flex flex-col gap-4 rounded-panel p-5">
      <QueryState :loading="isPending" :error="error" @retry="refetch()">
        <template #skeleton>
          <table data-skeleton-region="deleted-table" class="w-full text-left text-sm">
            <thead class="text-muted">
              <tr>
                <th v-for="index in 4" :key="index" :class="CELL">
                  <SkeletonBlock text class="w-12" />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="index in SKELETON_ROWS" :key="index" class="border-t border-line">
                <td :class="CELL"><SkeletonBlock text class="w-16" /></td>
                <td :class="CELL"><SkeletonBlock text class="w-32" /></td>
                <td :class="CELL"><SkeletonBlock text class="w-20" /></td>
                <td class="py-2"><SkeletonBlock pill class="ml-auto h-11 w-28" /></td>
              </tr>
            </tbody>
          </table>
        </template>
        <p v-if="data && data.items.length === 0" class="flex items-center gap-3 text-muted">
          <AdminBit placement="empty" />{{ $t('admin.lifecycle.empty') }}
        </p>
        <div v-else-if="data" class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <caption class="sr-only">
              {{
                $t('admin.lifecycle.tableCaption')
              }}
            </caption>
            <thead class="text-muted">
              <tr>
                <th scope="col" :class="HEAD">{{ $t('admin.lifecycle.columns.code') }}</th>
                <th scope="col" :class="HEAD">{{ $t('admin.lifecycle.columns.name') }}</th>
                <th scope="col" class="hidden md:table-cell" :class="HEAD">
                  {{ $t('admin.lifecycle.columns.deletedAt') }}
                </th>
                <th scope="col" class="hidden md:table-cell" :class="HEAD">
                  {{ $t('admin.lifecycle.columns.deletedBy') }}
                </th>
                <th scope="col" :class="HEAD">{{ $t('admin.lifecycle.columns.grace') }}</th>
                <th scope="col" class="py-2 text-right">
                  <span class="sr-only">{{ $t('admin.lifecycle.columns.actions') }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in data.items" :key="row.code" class="border-t border-line">
                <td :class="CELL" class="font-mono font-semibold">{{ row.code }}</td>
                <td :class="CELL">{{ row.name }}</td>
                <td class="hidden md:table-cell" :class="CELL">
                  {{ formatNumericDateTime(row.deletedAt, locale.locale) }}
                </td>
                <td class="hidden md:table-cell" :class="CELL">
                  {{ actorName(row.deletedBy) }}
                </td>
                <td :class="CELL" class="whitespace-nowrap">
                  {{
                    $t(
                      graceTextOf(row).key,
                      { count: graceTextOf(row).count },
                      graceTextOf(row).count,
                    )
                  }}
                </td>
                <td class="py-2">
                  <div class="flex min-h-11 flex-wrap items-center justify-end gap-2">
                    <button
                      v-if="!row.isPurged"
                      type="button"
                      :class="ADMIN_BUTTON_CLASS"
                      :aria-label="$t('admin.lifecycle.restoreLabel', { code: row.code })"
                      :aria-disabled="restore.isPending.value ? 'true' : undefined"
                      @click="restoreRow(row.code)"
                    >
                      {{ $t('admin.lifecycle.restore') }}
                    </button>
                    <button
                      v-if="isSuperuser && !row.isPurged"
                      type="button"
                      :class="ADMIN_DANGER_CLASS"
                      :aria-label="$t('admin.lifecycle.purgeNowLabel', { code: row.code })"
                      @click="openPurge(row)"
                    >
                      {{ $t('admin.lifecycle.purgeNow') }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <NumberedPager v-if="data" :meta="data.meta" :label="$t('admin.lifecycle.pager')" />
      </QueryState>
    </section>
    <TypedCodeDialog
      v-model:visible="isPurgeOpen"
      :code="purging?.code ?? ''"
      :title="$t('admin.lifecycle.purgeTitle', { code: purging?.code ?? '' })"
      :body="$t('admin.lifecycle.purgeBody')"
      :confirm-label="$t('admin.lifecycle.purgeConfirm')"
      :busy="purge.isPending.value"
      :failure-text="purgeFailure"
      @confirm="confirmPurge"
    />
  </div>
</template>
