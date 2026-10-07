<script setup lang="ts">
import { ArrowDown, ArrowUp, Check, CircleAlert } from 'lucide-vue-next';
import type { ProblemListItem, ProblemSort, ProblemSortField } from '@/api/types/problems';
import TokenCoin from '@/components/TokenCoin.vue';
import { formatNumber, initials } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';

const props = defineProps<{ problems: ProblemListItem[]; sort: ProblemSort | null }>();
const emit = defineEmits<{ sort: [sort: ProblemSort] }>();
const locale = useLocaleStore();

const SORTABLE = [
  { field: 'points', labelKey: 'problems.columns.points' },
  { field: 'acRate', labelKey: 'problems.columns.acRate' },
  { field: 'userCount', labelKey: 'problems.columns.users' },
] as const;
const ariaSort = (field: ProblemSortField) =>
  props.sort === field ? 'ascending' : props.sort === `-${field}` ? 'descending' : 'none';
/** Highest first on the first click, then lowest first. */
const nextSort = (field: ProblemSortField): ProblemSort =>
  props.sort === `-${field}` ? field : `-${field}`;
</script>

<template>
  <div tabindex="0" role="region" :aria-label="$t('problems.title')" class="overflow-x-auto">
    <table class="w-full min-w-[900px] border-collapse text-[15px]">
      <caption class="sr-only">
        {{
          $t('problems.title')
        }}
      </caption>
      <thead>
        <tr class="text-left text-[13px] text-muted">
          <th scope="col" class="px-6 py-4 font-medium">{{ $t('problems.columns.problem') }}</th>
          <th scope="col" class="px-2.5 py-4 font-medium">{{ $t('problems.columns.types') }}</th>
          <th
            v-for="column in SORTABLE"
            :key="column.field"
            scope="col"
            :aria-sort="ariaSort(column.field)"
            class="px-2.5 py-2 text-right font-medium"
          >
            <button
              type="button"
              class="inline-flex min-h-11 items-center gap-1 hover:text-content"
              @click="emit('sort', nextSort(column.field))"
            >
              {{ $t(column.labelKey) }}
              <ArrowDown v-if="sort === `-${column.field}`" class="size-3.5" aria-hidden="true" />
              <ArrowUp v-else-if="sort === column.field" class="size-3.5" aria-hidden="true" />
            </button>
          </th>
          <th scope="col" class="px-6 py-4 text-right font-medium">
            {{ $t('problems.columns.status') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="problem in problems" :key="problem.id" class="border-t border-line">
          <td class="px-6 py-3.5">
            <div class="flex items-center gap-3">
              <TokenCoin :seed="problem.code" :label="initials(problem.name)" />
              <div>
                <RouterLink
                  :to="{ name: 'problem', params: { code: problem.code } }"
                  class="font-semibold text-content hover:underline"
                  >{{ problem.name }}</RouterLink
                >
                <div class="font-mono text-xs text-muted">{{ problem.code }}</div>
              </div>
            </div>
          </td>
          <td class="px-2.5 py-3.5 text-muted">
            {{ problem.types.map((type) => type.fullName).join(', ') }}
          </td>
          <td class="px-2.5 py-3.5 text-right font-mono tabular-nums">
            {{ formatNumber(problem.points, locale.locale, 2) }}
          </td>
          <td class="px-2.5 py-3.5 text-right font-mono tabular-nums">
            {{ formatNumber(problem.acRate, locale.locale, 1) }}%
          </td>
          <td class="px-2.5 py-3.5 text-right font-mono tabular-nums">
            {{ formatNumber(problem.userCount, locale.locale) }}
          </td>
          <td class="px-6 py-3.5 text-right">
            <span
              v-if="problem.viewerStatus === 'solved'"
              class="inline-flex items-center gap-1.5 rounded-pill bg-verdict-ac-bg px-3 py-1.5 text-[13px] font-semibold text-verdict-ac"
            >
              <Check class="size-4" aria-hidden="true" />{{ $t('problems.solved') }}
            </span>
            <span
              v-else-if="problem.viewerStatus === 'attempted'"
              class="inline-flex items-center gap-1.5 rounded-pill bg-verdict-tle-bg px-3 py-1.5 text-[13px] font-semibold text-verdict-tle"
            >
              <CircleAlert class="size-4" aria-hidden="true" />{{ $t('problems.attempted') }}
            </span>
            <RouterLink
              v-else
              :to="{ name: 'problem', params: { code: problem.code } }"
              class="inline-flex min-h-11 items-center rounded-pill bg-accent-soft px-3.5 text-[13px] font-semibold text-accent-soft-text"
            >
              {{ $t('problems.solve') }}<span class="sr-only">: {{ problem.name }}</span>
            </RouterLink>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
