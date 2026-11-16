<script setup lang="ts">
import { computed } from 'vue';
import type { EditableContest } from '@/api/types/contest-editing';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { CARD } from '../../ui/controls';
import ContestPhaseChip from '../list/ContestPhaseChip.vue';
import ContestVisibilitySwitch from './ContestVisibilitySwitch.vue';
import { CONTEST_SECTION_KEYS, contestSectionLabel, jumpToSection } from './contest-sections';

/**
 * The contest at a glance on the general and problems tabs: phase, the "Hiển thị" switch and the counts. A strip above the
 * tab below 1280 px, a sticky right rail from there; on the Advanced view the rail also links to the form's sections.
 */
const props = defineProps<{ contest: EditableContest; hasSections?: boolean }>();
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
    class="flex flex-col gap-3 xl:sticky xl:top-16"
    :aria-label="$t('admin.contests.general.rail.label')"
    data-testid="contest-summary"
  >
    <div
      :class="[
        CARD,
        'grid grid-cols-2 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] xl:flex xl:flex-col xl:divide-y xl:divide-line',
      ]"
    >
      <div
        class="flex flex-col items-start justify-center gap-1 px-4 py-3 xl:flex-row xl:items-center xl:justify-between"
      >
        <span class="text-caption leading-4 text-muted">{{
          $t('admin.contests.general.rail.phase')
        }}</span>
        <ContestPhaseChip :phase="contest.phase" />
      </div>
      <ContestVisibilitySwitch
        :contest="contest"
        class="px-4 py-3 max-sm:order-last max-sm:col-span-2"
      />
      <div v-for="stat in stats" :key="stat.key" class="flex flex-col px-4 py-3">
        <span class="text-caption leading-4 text-muted">{{
          $t(`admin.contests.general.rail.${stat.key}`)
        }}</span>
        <span class="font-display text-section leading-7 font-semibold tabular-nums">{{
          stat.value
        }}</span>
        <span v-if="stat.note" class="text-caption leading-4 text-muted">
          {{ $t(`admin.contests.general.rail.${stat.note.key}`, { count: stat.note.count }) }}
        </span>
      </div>
    </div>
    <nav
      v-if="hasSections"
      :class="[CARD, 'hidden flex-col p-2 xl:flex']"
      :aria-label="$t('admin.form.section.jumpTo')"
    >
      <p
        class="m-0 px-2 pt-1 pb-1.5 text-caption leading-4 font-semibold tracking-wide text-muted uppercase"
      >
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
