<script setup lang="ts">
import { UNCATEGORIZED_TYPE_NAME, problemTypeLabel } from './problem-type-label';
import type { ProblemListItem, ProblemSort } from '@/api/types/problems';
import CompactListRow from '@/components/CompactListRow.vue';
import ScrollRegion from '@/components/ScrollRegion.vue';
import { COMPACT_LIST_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { formatNumber, formatProblemPoints } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import FactLine from '@/components/FactLine.vue';
import ProblemStatusMark from './ProblemStatusMark.vue';
import ProblemTierMark from './ProblemTierMark.vue';
import ProblemTableColumns from './ProblemTableColumns.vue';
import ProblemTableHead from './ProblemTableHead.vue';
import { useRowLink } from './use-row-link';

defineProps<{
  problems: ProblemListItem[];
  sort: ProblemSort | null;
  /** Without a viewer there is no status to show, not even "not tried". */
  signedIn: boolean;
}>();
const emit = defineEmits<{ sort: [sort: ProblemSort | null] }>();
const locale = useLocaleStore();
const { open, openInTab } = useRowLink();
const target = (code: string) => ({ name: 'problem', params: { code } });
/** P-04 B: a phone gets compact rows instead of a table that scrolls sideways. */
const isCompact = useMediaQuery(COMPACT_LIST_QUERY);

/** The catch-all type says nothing in a list: a problem with no other type shows a dash. */
const typesText = (problem: ProblemListItem) => {
  const named = problem.types.filter((type) => type.name !== UNCATEGORIZED_TYPE_NAME);
  return named.length ? named.map((type) => problemTypeLabel(type)).join(', ') : '—';
};
</script>

<template>
  <ul v-if="isCompact" :aria-label="$t('problems.listName')" class="m-0 list-none p-0">
    <CompactListRow
      v-for="problem in problems"
      :key="problem.id"
      :to="target(problem.code)"
      :title="problem.name"
    >
      <template v-if="signedIn" #lead
        ><ProblemStatusMark :status="problem.viewerStatus"
      /></template>
      <template #meta>
        <FactLine
          class="font-mono"
          :facts="[problem.code, `AC ${formatNumber(problem.acRate, locale.locale, 1)}%`]"
        />
      </template>
      <template #trail>
        <span class="inline-flex items-center gap-[7px] font-mono text-sm font-medium tabular-nums">
          <ProblemTierMark :points="problem.points" />
          {{ formatProblemPoints(problem.points, problem.partial, locale.locale) }}
        </span>
        <span class="text-caption text-muted tabular-nums">{{
          $t('problems.solverCount', { count: formatNumber(problem.userCount, locale.locale) })
        }}</span>
      </template>
    </CompactListRow>
  </ul>
  <ScrollRegion v-else :label="$t('problems.scrollRegion')">
    <table class="w-full min-w-[900px] table-fixed border-collapse text-sm">
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
          <td class="truncate px-3 py-2 text-caption text-muted">
            {{ typesText(problem) }}
          </td>
          <td class="px-3 py-2">
            <span class="inline-flex items-center gap-[7px] font-medium tabular-nums">
              <ProblemTierMark :points="problem.points" />
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
