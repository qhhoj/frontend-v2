<script setup lang="ts">
import { problemTypeLabel } from './problem-type-label';
import type { ProblemListItem, ProblemSort } from '@/api/types/problems';
import ScrollRegion from '@/components/ScrollRegion.vue';
import { formatNumber, formatProblemPoints } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import ProblemStatusMark from './ProblemStatusMark.vue';
import ProblemTableColumns from './ProblemTableColumns.vue';
import ProblemTableHead from './ProblemTableHead.vue';
import { tierOf } from './problem-tier';
import { useRowLink } from './use-row-link';

defineProps<{
  problems: ProblemListItem[];
  sort: ProblemSort | null;
  /** Without a viewer there is no status to show, not even "not tried". */
  signedIn: boolean;
}>();
const emit = defineEmits<{ sort: [sort: ProblemSort] }>();
const locale = useLocaleStore();
const { open, openInTab } = useRowLink();
const target = (code: string) => ({ name: 'problem', params: { code } });

const TIER_CLASS = { 1: 'bg-diff-1', 2: 'bg-diff-2', 3: 'bg-diff-3', 4: 'bg-diff-4' } as const;
</script>

<template>
  <ScrollRegion :label="$t('problems.scrollRegion')">
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
          class="cursor-pointer border-t border-line hover:bg-surface-hover"
          @click="open($event, target(problem.code))"
          @auxclick="openInTab($event, target(problem.code))"
        >
          <td class="py-2.5 pl-[22px]">
            <ProblemStatusMark v-if="signedIn" :status="problem.viewerStatus" />
          </td>
          <td class="min-w-0 px-3 py-2">
            <RouterLink
              :to="target(problem.code)"
              class="block truncate font-medium text-content hover:text-accent-text"
              >{{ problem.name }}</RouterLink
            >
            <span class="font-mono text-xs text-muted">{{ problem.code }}</span>
          </td>
          <td class="truncate px-3 py-2 text-[12.5px] text-muted">
            {{ problem.types.map((type) => problemTypeLabel(type)).join(', ') }}
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
  </ScrollRegion>
</template>
