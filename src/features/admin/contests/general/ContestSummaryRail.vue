<script setup lang="ts">
import { computed } from 'vue';
import type { EditableContest } from '@/api/types/contest-editing';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { CARD } from '../../ui/controls';
import ContestPhaseChip from '../list/ContestPhaseChip.vue';
import { CONTEST_SECTION_KEYS, contestSectionLabel, jumpToSection } from './contest-sections';

/** The general tab's right rail from 1280 px: the contest at a glance, then the form's sections as jump links. */
const props = defineProps<{ contest: EditableContest }>();
const locale = useLocaleStore();
const stats = computed(() => [
  {
    key: 'participants',
    value: formatNumber(props.contest.userCount, locale.locale),
    note: props.contest.virtualCount
      ? { key: 'virtual', count: formatNumber(props.contest.virtualCount, locale.locale) }
      : null,
  },
  {
    key: 'problems',
    value: formatNumber(props.contest.problems?.length ?? 0, locale.locale),
    note: null,
  },
]);
const LINK =
  'flex min-h-8 items-center rounded-cell px-2 text-sm text-muted hover:bg-surface-hover hover:text-content';
</script>

<template>
  <aside
    class="sticky top-16 flex flex-col gap-3"
    :aria-label="$t('admin.contests.general.rail.label')"
  >
    <div :class="[CARD, 'flex flex-col divide-y divide-line']">
      <div class="flex items-center justify-between gap-2 px-4 py-3">
        <span class="text-xs text-muted">{{ $t('admin.contests.general.rail.phase') }}</span>
        <ContestPhaseChip :phase="contest.phase" />
      </div>
      <div v-for="stat in stats" :key="stat.key" class="flex flex-col px-4 py-3">
        <span class="text-xs text-muted">{{ $t(`admin.contests.general.rail.${stat.key}`) }}</span>
        <span class="font-display text-xl font-semibold tabular-nums">{{ stat.value }}</span>
        <span v-if="stat.note" class="text-xs text-muted">
          {{ $t(`admin.contests.general.rail.${stat.note.key}`, { count: stat.note.count }) }}
        </span>
      </div>
    </div>
    <nav :class="[CARD, 'flex flex-col p-2']" :aria-label="$t('admin.form.section.jumpTo')">
      <p class="m-0 px-2 pt-1 pb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
        {{ $t('admin.form.section.jumpTo') }}
      </p>
      <button
        v-for="key in CONTEST_SECTION_KEYS"
        :key="key"
        type="button"
        :class="[LINK, 'text-left']"
        @click="jumpToSection(key)"
      >
        {{ contestSectionLabel(key) }}
      </button>
    </nav>
  </aside>
</template>
