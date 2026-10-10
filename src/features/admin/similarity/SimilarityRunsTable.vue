<script setup lang="ts">
import EmptyState from '@/components/EmptyState.vue';
import AdminBit from '../shell/AdminBit.vue';
import { shortId } from '../ui/short-id';
import { formatDateTime, formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import type { SimilarityRun, SimilarityScope } from '@/api/types/similarity';
import { isActive, scopeQuery, totalPairs } from './similarity-runs';
import { runDurationText, runStatusText } from './run-text';

const props = defineProps<{ runs: SimilarityRun[]; scope: SimilarityScope }>();

const locale = useLocaleStore();

const pairsText = (run: SimilarityRun) => {
  const pairs = totalPairs(run);
  return pairs === null ? '—' : formatNumber(pairs, locale.locale);
};

const detailTo = (run: SimilarityRun) => ({
  name: 'admin-similarity',
  query: { ...scopeQuery(props.scope), run: run.id },
});
</script>

<template>
  <section class="flex flex-col gap-3">
    <h2 class="font-display text-base font-bold">
      {{
        'problem' in scope
          ? $t('admin.similarity.runs.ofProblem', { code: scope.problem })
          : $t('admin.similarity.runs.ofContest', { key: scope.contest })
      }}
    </h2>
    <p class="text-sm text-muted">{{ $t('admin.similarity.runs.note') }}</p>
    <EmptyState v-if="runs.length === 0">{{ $t('admin.similarity.runs.empty') }}</EmptyState>
    <div
      v-else
      class="overflow-x-auto"
      role="region"
      tabindex="0"
      :aria-label="$t('admin.similarity.runs.label')"
    >
      <table data-testid="runs" class="w-full text-sm">
        <thead class="text-left text-muted">
          <tr>
            <th scope="col" class="p-2">{{ $t('admin.similarity.runs.columns.id') }}</th>
            <th scope="col" class="p-2">{{ $t('admin.similarity.runs.columns.status') }}</th>
            <th scope="col" class="hidden p-2 md:table-cell">
              {{ $t('admin.similarity.runs.columns.createdAt') }}
            </th>
            <th scope="col" class="hidden p-2 md:table-cell">
              {{ $t('admin.similarity.runs.columns.duration') }}
            </th>
            <th scope="col" class="hidden p-2 md:table-cell">
              {{ $t('admin.similarity.runs.columns.groups') }}
            </th>
            <th scope="col" class="hidden p-2 md:table-cell">
              {{ $t('admin.similarity.runs.columns.pairs') }}
            </th>
            <th scope="col" class="p-2">
              <span class="sr-only">{{ $t('admin.similarity.runs.columns.detail') }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="run in runs" :key="run.id" class="border-t border-line">
            <td class="p-2 font-mono">{{ shortId(run.id) }}</td>
            <td class="p-2">
              <span class="inline-flex items-center gap-2">
                {{ runStatusText(run) }}
                <AdminBit v-if="isActive(run)" placement="queued" />
              </span>
            </td>
            <td class="hidden p-2 md:table-cell">
              {{ formatDateTime(run.createdAt, locale.locale) }}
            </td>
            <td class="hidden p-2 md:table-cell">{{ runDurationText(run) }}</td>
            <td class="hidden p-2 md:table-cell">{{ run.groups.length }}</td>
            <td class="hidden p-2 md:table-cell">{{ pairsText(run) }}</td>
            <td class="p-2">
              <RouterLink
                :to="detailTo(run)"
                class="inline-flex min-h-11 items-center font-semibold underline"
              >
                {{ $t('admin.similarity.runs.detail') }}
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
