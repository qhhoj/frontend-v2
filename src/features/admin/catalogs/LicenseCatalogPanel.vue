<script setup lang="ts">
import { ref } from 'vue';
import type { LicenseAdmin } from '@/api/types/problem-catalogs';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import { useLicensesAdminQuery } from './catalogs.queries';
import LicenseEditor from './LicenseEditor.vue';

/** Licenses: the editor above, the rows below; never deleted (problems reference them). */
const { data: rows, isPending, error, refetch } = useLicensesAdminQuery();
const editing = ref<LicenseAdmin | null>(null);
</script>

<template>
  <div class="flex flex-col gap-5">
    <LicenseEditor :row="editing" @done="editing = null" />
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <SkeletonBlock data-skeleton-region="catalog-rows" class="h-48 w-full rounded-panel" />
      </template>
      <p v-if="rows && rows.length === 0" class="glass rounded-panel p-5 text-muted">
        {{ $t('admin.catalogs.empty') }}
      </p>
      <div v-else-if="rows" class="glass overflow-x-auto rounded-panel p-3">
        <table class="w-full text-sm">
          <caption class="sr-only">
            {{
              $t('admin.catalogs.licenses.caption')
            }}
          </caption>
          <thead class="text-left text-muted">
            <tr>
              <th scope="col" class="px-2 py-2">{{ $t('admin.catalogs.fields.key') }}</th>
              <th scope="col" class="px-2 py-2">{{ $t('admin.catalogs.fields.name') }}</th>
              <th scope="col" class="hidden px-2 py-2 md:table-cell">
                {{ $t('admin.catalogs.fields.link') }}
              </th>
              <th scope="col" class="px-2 py-2">
                <span class="sr-only">{{ $t('admin.catalogs.actions') }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id" class="border-t border-line">
              <td class="px-2 py-3 font-mono">{{ row.key }}</td>
              <td class="px-2 py-3">{{ row.name }}</td>
              <td class="hidden max-w-xs truncate px-2 py-3 text-muted md:table-cell">
                {{ row.link || '—' }}
              </td>
              <td class="px-2 py-3 text-right">
                <button type="button" :class="ADMIN_BUTTON_CLASS" @click="editing = row">
                  {{ $t('admin.catalogs.edit') }}<span class="sr-only">{{ ' ' + row.name }}</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </QueryState>
  </div>
</template>
