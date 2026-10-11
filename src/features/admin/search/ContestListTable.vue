<script setup lang="ts">
import { checked } from '../ui/use-row-selection';
import type { ContestListItem } from '@/api/types/contests';
import { formatDateTime, formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import HighlightedText from './HighlightedText.vue';

/** One page of the staff contest list: badges for what hides or limits a contest, and per-row shortcuts. */
defineProps<{
  items: ContestListItem[];
  search: string;
  isSelected: (key: string) => boolean;
  isAllSelected: boolean;
  isSomeSelected: boolean;
}>();
const emit = defineEmits<{ toggle: [key: string, isOn: boolean]; toggleAll: [isOn: boolean] }>();
const locale = useLocaleStore();
const isLocked = (contest: ContestListItem) =>
  contest.editor?.lockedAfter != null && Date.parse(contest.editor.lockedAfter) <= Date.now();
/** The row's shortcuts besides editing: the ranking, and the Actions tab (where rating runs) once a rated contest has ended. */
const shortcutsOf = (contest: ContestListItem) => [
  { label: 'ranking', to: { name: 'contest-ranking', params: { key: contest.key } } },
  ...(contest.isRated && contest.phase === 'ended'
    ? [{ label: 'rate', to: { name: 'admin-contestActions', params: { key: contest.key } } }]
    : []),
];
const BADGE = 'rounded-pill border border-line px-2 py-0.5 font-sans text-xs';
const WARN_BADGE = 'rounded-pill bg-verdict-wa-bg px-2 py-0.5 font-sans text-xs text-verdict-wa';
const LINK = 'min-h-11 inline-flex items-center text-sm text-accent hover:underline';
</script>

<template>
  <table class="w-full text-left text-sm">
    <caption class="sr-only">
      {{
        $t('admin.search.contests.title')
      }}
    </caption>
    <thead class="text-xs text-muted uppercase">
      <tr>
        <th scope="col" class="w-11 px-3 py-2">
          <input
            type="checkbox"
            class="size-5"
            :checked="isAllSelected"
            :indeterminate="isSomeSelected"
            :aria-label="$t('admin.contests.bulk.selectPage')"
            @change="emit('toggleAll', checked($event))"
          />
        </th>
        <th scope="col" class="px-3 py-2">{{ $t('admin.search.contests.columns.contest') }}</th>
        <th scope="col" class="hidden px-3 py-2 md:table-cell">
          {{ $t('admin.search.contests.columns.time') }}
        </th>
        <th scope="col" class="hidden px-3 py-2 sm:table-cell">
          {{ $t('admin.search.contests.columns.users') }}
        </th>
        <th scope="col" class="hidden px-3 py-2 lg:table-cell">
          {{ $t('admin.search.contests.columns.pending') }}
        </th>
        <th scope="col" class="hidden px-3 py-2 sm:table-cell">
          <span class="sr-only">{{ $t('admin.search.contests.columns.actions') }}</span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="contest in items" :key="contest.key" class="border-t border-line align-top">
        <td class="px-3 py-3">
          <input
            type="checkbox"
            class="size-5"
            :checked="isSelected(contest.key)"
            :aria-label="$t('admin.contests.bulk.selectRow', { name: contest.key })"
            @change="emit('toggle', contest.key, checked($event))"
          />
        </td>
        <td class="px-3 py-3">
          <RouterLink
            :to="{ name: 'admin-contestGeneral', params: { key: contest.key } }"
            class="font-semibold text-accent hover:underline"
          >
            <HighlightedText :text="contest.name" :query="search" />
          </RouterLink>
          <div class="flex flex-wrap items-center gap-1.5 pt-1 font-mono text-xs text-muted">
            <HighlightedText :text="contest.key" :query="search" />
            <span>· {{ $t(`contests.phase.${contest.phase}`) }}</span>
            <span v-if="contest.editor && !contest.editor.isVisible" :class="WARN_BADGE">
              {{ $t('admin.search.contests.badges.hidden') }}
            </span>
            <span v-if="contest.isPrivate" :class="BADGE">
              {{ $t('admin.search.contests.badges.private') }}
            </span>
            <span v-if="contest.isOrganizationPrivate" :class="BADGE">
              {{ $t('admin.search.contests.badges.organization') }}
            </span>
            <span v-if="isLocked(contest)" :class="BADGE">
              {{ $t('admin.search.contests.badges.locked') }}
            </span>
            <span v-if="contest.isRated" :class="BADGE">
              {{ $t('admin.search.contests.rated') }}
            </span>
          </div>
          <div class="pt-1 text-xs text-muted md:hidden">
            {{ formatDateTime(contest.startTime, locale.locale) }}
          </div>
          <div class="flex flex-wrap gap-x-4 sm:hidden">
            <RouterLink
              v-for="shortcut in shortcutsOf(contest)"
              :key="shortcut.label"
              :to="shortcut.to"
              :class="LINK"
            >
              {{ $t(`admin.search.contests.${shortcut.label}`) }}
            </RouterLink>
          </div>
        </td>
        <td class="hidden px-3 py-3 md:table-cell">
          {{ formatDateTime(contest.startTime, locale.locale) }} –
          {{ formatDateTime(contest.endTime, locale.locale) }}
        </td>
        <td class="hidden px-3 py-3 font-mono sm:table-cell">
          {{ formatNumber(contest.userCount, locale.locale) }}
        </td>
        <td class="hidden px-3 py-3 font-mono lg:table-cell">
          <template v-if="contest.editor?.pendingCount != null">
            {{ formatNumber(contest.editor.pendingCount, locale.locale) }}
          </template>
          <span v-else class="text-muted">—</span>
        </td>
        <td class="hidden px-3 py-3 sm:table-cell">
          <div class="flex flex-col items-end whitespace-nowrap">
            <RouterLink
              :to="{ name: 'admin-contestGeneral', params: { key: contest.key } }"
              :class="ADMIN_BUTTON_CLASS"
              >{{ $t('admin.search.edit') }}</RouterLink
            >
            <RouterLink
              v-for="shortcut in shortcutsOf(contest)"
              :key="shortcut.label"
              :to="shortcut.to"
              :class="LINK"
            >
              {{ $t(`admin.search.contests.${shortcut.label}`) }}
            </RouterLink>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>
