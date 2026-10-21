<script setup lang="ts">
import { computed } from 'vue';
import type { Schemas } from '@/api/schemas';
import { TriangleAlert } from 'lucide-vue-next';
import { summaryRowsOf } from './import-outcome';

/**
 * "Khác gì so với Polygon": what the conversion made of the package, a clamp noted beside the value it changed, and a
 * setting a sync kept as edited on QHHOJ (`kept`) noted the same way.
 */
const props = defineProps<{
  summary: Schemas['ImportSummaryResponse'];
  kept?: readonly Schemas['SyncedSetting'][];
}>();
const rows = computed(() => summaryRowsOf(props.summary, props.kept));
</script>

<template>
  <section class="flex flex-col gap-2" aria-labelledby="import-summary-title">
    <h3 id="import-summary-title" class="font-display font-semibold">
      {{ $t('admin.polygonLink.progress.summary.title') }}
    </h3>
    <table class="w-full text-sm" data-testid="import-summary">
      <thead class="sr-only">
        <tr>
          <th scope="col">{{ $t('admin.polygonLink.progress.summary.item') }}</th>
          <th scope="col">{{ $t('admin.polygonLink.progress.summary.value') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.key" class="border-t border-line">
          <th scope="row" class="w-24 py-2 pr-3 text-left align-top font-normal text-muted">
            {{ $t(`admin.polygonLink.progress.summary.rows.${row.key}`) }}
          </th>
          <td class="py-2">
            <span class="flex flex-wrap items-center justify-between gap-2">
              <span class="min-w-0 break-words">{{ row.value }}</span>
              <span
                v-if="row.note"
                class="inline-flex items-start gap-1 rounded-cell bg-warning-bg px-2 py-0.5 text-meta font-semibold text-warning"
              >
                <TriangleAlert aria-hidden="true" class="mt-0.5 size-3.5 shrink-0" />
                {{ row.note }}
              </span>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
