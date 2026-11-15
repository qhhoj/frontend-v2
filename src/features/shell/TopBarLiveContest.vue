<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CurrentParticipation } from '@/api/types/contests';
import CountdownTimer from '@/components/CountdownTimer.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { participationKind } from '@/features/contests/bar/current-contest';

/**
 * The top bar's chip for the contest the viewer is in, on every page except that contest's own (there `ContestBar` is the
 * status): a live dot, the contest's name (cut short), the rank when there is one and the time left; a phone keeps the dot
 * and the clock. It links to the
 * contest. It reads the participation `AppShell` already asks for, so it adds no request.
 */
const props = defineProps<{ current: CurrentParticipation }>();
const { t } = useI18n();
const locale = useLocaleStore();
/** The viewer's place; none for a spectator, a hidden board or a frozen one (the board shows no live place during a freeze). */
const rank = computed(() =>
  props.current.standing?.frozen ? null : (props.current.standing?.rank ?? null),
);
const kind = computed(() => participationKind(props.current.participation.virtual));
const statusText = computed(() => {
  if (kind.value === 'virtual')
    return t('contestBar.virtual', { run: props.current.participation.virtual });
  return t(kind.value === 'spectate' ? 'contestBar.spectate' : 'contestBar.live');
});
</script>

<template>
  <RouterLink
    :to="{ name: 'contest', params: { key: current.contest.key } }"
    data-testid="top-bar-live-contest"
    :title="current.contest.name"
    class="inline-flex h-9 min-w-0 items-center gap-2 rounded-control px-2 text-sm font-semibold text-content hover:bg-surface-hover touch:h-11"
  >
    <span aria-hidden="true" class="size-2 shrink-0 rounded-full bg-positive" />
    <span class="sr-only">{{ statusText }} · </span>
    <span class="max-w-40 truncate max-md:sr-only">{{ current.contest.name }}</span>
    <span v-if="rank !== null" class="shrink-0 font-mono text-meta text-secondary max-md:sr-only"
      >#{{ formatNumber(rank, locale.locale) }}</span
    >
    <CountdownTimer
      :key="current.participation.endTime"
      :until="current.participation.endTime"
      class="shrink-0 text-meta text-secondary"
    />
  </RouterLink>
</template>
