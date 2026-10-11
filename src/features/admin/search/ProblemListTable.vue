<script setup lang="ts">
import type { ProblemListItem } from '@/api/types/problems';
import { formatDate, formatProblemPoints } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import HighlightedText from './HighlightedText.vue';

/** One page of the staff list; with `selectable` each row has a checkbox for the bulk actions. */
defineProps<{
  items: ProblemListItem[];
  search: string;
  selectable: boolean;
  isSelected: (code: string) => boolean;
  isAllSelected: boolean;
  isSomeSelected: boolean;
}>();
const emit = defineEmits<{ toggle: [code: string, isOn: boolean]; toggleAll: [isOn: boolean] }>();
const locale = useLocaleStore();
const checked = (event: Event) => (event.target as HTMLInputElement).checked;
const dateText = (iso: string | null) => (iso ? formatDate(iso, locale.locale) : '—');
const BADGE = 'rounded-pill border border-line px-2 py-0.5 font-sans';
</script>

<template>
  <table class="w-full text-left text-sm">
    <caption class="sr-only">
      {{
        $t('admin.search.problems.title')
      }}
    </caption>
    <thead class="text-xs text-muted uppercase">
      <tr>
        <th v-if="selectable" scope="col" class="w-11 px-3 py-2">
          <input
            type="checkbox"
            class="size-5"
            :checked="isAllSelected"
            :indeterminate="isSomeSelected"
            :aria-label="$t('admin.problemList.selectPage')"
            @change="emit('toggleAll', checked($event))"
          />
        </th>
        <th scope="col" class="px-3 py-2">{{ $t('admin.search.problems.columns.problem') }}</th>
        <th scope="col" class="hidden px-3 py-2 md:table-cell">
          {{ $t('admin.problemList.columns.authors') }}
        </th>
        <th scope="col" class="hidden px-3 py-2 lg:table-cell">
          {{ $t('admin.problemList.columns.group') }}
        </th>
        <th scope="col" class="px-3 py-2">{{ $t('admin.search.problems.columns.points') }}</th>
        <th scope="col" class="hidden px-3 py-2 lg:table-cell">
          {{ $t('admin.problemList.columns.date') }}
        </th>
        <th scope="col" class="hidden px-3 py-2 sm:table-cell">
          <span class="sr-only">{{ $t('admin.search.edit') }}</span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="problem in items" :key="problem.id" class="border-t border-line">
        <td v-if="selectable" class="px-3 py-3 align-top">
          <input
            type="checkbox"
            class="size-5"
            :checked="isSelected(problem.code)"
            :aria-label="$t('admin.problemList.selectRow', { code: problem.code })"
            @change="emit('toggle', problem.code, checked($event))"
          />
        </td>
        <td class="px-3 py-3">
          <RouterLink
            :to="{ name: 'admin-problemGeneral', params: { code: problem.code } }"
            class="font-semibold text-accent hover:underline"
          >
            <HighlightedText :text="problem.name" :query="search" />
          </RouterLink>
          <div class="flex flex-wrap items-center gap-2 font-mono text-xs text-muted">
            <HighlightedText :text="problem.code" :query="search" />
            <span v-if="!problem.isPublic" :class="BADGE">{{
              $t('admin.search.problems.private')
            }}</span>
            <span v-if="problem.isOrganizationPrivate" :class="BADGE">{{
              $t('admin.problemList.orgPrivate')
            }}</span>
          </div>
        </td>
        <td class="hidden px-3 py-3 md:table-cell">
          <span v-if="problem.authors.length === 0" class="text-muted">—</span>
          <span v-else>{{ problem.authors.map((author) => author.username).join(', ') }}</span>
        </td>
        <td class="hidden px-3 py-3 lg:table-cell">{{ problem.group?.fullName ?? '—' }}</td>
        <td class="px-3 py-3 font-mono">
          {{ formatProblemPoints(problem.points, problem.partial, locale.locale) }}
        </td>
        <td class="hidden px-3 py-3 whitespace-nowrap text-muted lg:table-cell">
          {{ dateText(problem.date) }}
        </td>
        <td class="hidden px-3 py-3 text-right sm:table-cell">
          <RouterLink
            :to="{ name: 'admin-problemGeneral', params: { code: problem.code } }"
            :class="ADMIN_BUTTON_CLASS"
            >{{ $t('admin.search.edit') }}</RouterLink
          >
        </td>
      </tr>
    </tbody>
  </table>
</template>
