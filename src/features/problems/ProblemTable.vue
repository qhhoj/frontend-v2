<script setup lang="ts">
import type { ProblemListItem, ProblemSort } from '@/api/types/problems';
import { formatNumber, formatProblemPoints } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import ProblemStatusMark from './ProblemStatusMark.vue';
import ProblemTableColumns from './ProblemTableColumns.vue';
import ProblemTableHead from './ProblemTableHead.vue';
import { tierOf } from './problem-tier';

defineProps<{ problems: ProblemListItem[]; sort: ProblemSort | null }>();
const emit = defineEmits<{ sort: [sort: ProblemSort] }>();
const locale = useLocaleStore();

const TIER_CLASS = { 1: 'bg-diff-1', 2: 'bg-diff-2', 3: 'bg-diff-3', 4: 'bg-diff-4' } as const;
</script>

<template>
  <div
    tabindex="0"
    role="region"
    :aria-label="$t('problems.scrollRegion')"
    class="overflow-x-auto focus-visible:-outline-offset-2"
  >
    <table class="w-full min-w-[900px] table-fixed border-collapse text-[14.5px]">
      <caption class="sr-only">
        {{
          $t('problems.listName')
        }}
      </caption>
      <ProblemTableColumns />
      <ProblemTableHead :sort="sort" interactive @sort="emit('sort', $event)" />
      <tbody>
        <tr
          v-for="problem in problems"
          :key="problem.id"
          class="relative border-t border-line hover:bg-surface-hover"
        >
          <td class="py-2.5 pl-[22px]"><ProblemStatusMark :status="problem.viewerStatus" /></td>
          <td class="min-w-0 px-3 py-2">
            <RouterLink
              :to="{ name: 'problem', params: { code: problem.code } }"
              class="block truncate font-medium text-content after:absolute after:inset-0 hover:text-accent-text"
              >{{ problem.name }}</RouterLink
            >
            <span class="font-mono text-xs text-muted">{{ problem.code }}</span>
          </td>
          <td class="truncate px-3 py-2 text-[12.5px] text-muted">
            {{ problem.types.map((type) => type.fullName).join(', ') }}
          </td>
          <td class="px-3 py-2">
            <span class="inline-flex items-center gap-[7px] font-medium tabular-nums">
              <span
                aria-hidden="true"
                data-testid="tier-mark"
                :data-tier="tierOf(problem.points)"
                class="size-[9px] rounded-[3px]"
                :class="TIER_CLASS[tierOf(problem.points)]"
              />
              {{ formatProblemPoints(problem.points, problem.partial, locale.locale) }}
            </span>
          </td>
          <td class="px-3 py-2 text-right tabular-nums">
            {{ formatNumber(problem.acRate, locale.locale, 1) }}%
          </td>
          <td class="py-2 pr-[22px] pl-3 text-right tabular-nums">
            {{ formatNumber(problem.userCount, locale.locale) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
