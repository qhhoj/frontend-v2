<script setup lang="ts">
import { ref } from 'vue';
import type { TaxonAdmin, TaxonKind } from '@/api/types/problem-catalogs';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import { useTaxaQuery } from './catalogs.queries';
import TaxonEditor from './TaxonEditor.vue';

/** One name-only catalog: the editor above, the rows below; rows are never deleted (problems reference them). Keyed by `kind`. */
const props = defineProps<{ kind: TaxonKind }>();
const { data: rows, isPending, error, refetch } = useTaxaQuery(props.kind);
const editing = ref<TaxonAdmin | null>(null);
</script>

<template>
  <div class="flex flex-col gap-5">
    <TaxonEditor :kind="kind" :row="editing" @done="editing = null" />
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
              $t(`admin.catalogs.${kind}.caption`)
            }}
          </caption>
          <thead class="text-left text-muted">
            <tr>
              <th scope="col" class="px-2 py-2">{{ $t('admin.catalogs.fields.name') }}</th>
              <th scope="col" class="px-2 py-2">{{ $t('admin.catalogs.fields.fullName') }}</th>
              <th scope="col" class="px-2 py-2">
                <span class="sr-only">{{ $t('admin.catalogs.actions') }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id" class="border-t border-line">
              <td class="px-2 py-3 font-mono">{{ row.name }}</td>
              <td class="px-2 py-3">{{ row.fullName }}</td>
              <td class="px-2 py-3 text-right">
                <button type="button" :class="ADMIN_BUTTON_CLASS" @click="editing = row">
                  {{ $t('admin.catalogs.edit')
                  }}<span class="sr-only">{{ ' ' + row.fullName }}</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </QueryState>
  </div>
</template>
