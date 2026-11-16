<script setup lang="ts">
import { Eye, History, Radio } from 'lucide-vue-next';
import { computed, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CurrentParticipation } from '@/api/types/contests';
import CountdownTimer from '@/components/CountdownTimer.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Popover from '@/components/ui/Popover.vue';
import { useUnreadAnnouncementCount } from '@/features/contests/announcement-seen';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { participationKind } from '@/features/contests/bar/current-contest';
import { CONTEST_LINK_ROUTES } from '@/features/contests/bar/contest-links';

/**
 * The top bar's chip for the contest the viewer is in, on every page except that contest's own (there `ContestBar` is the
 * status). It shows the state (an icon and, from `md`, its word: live, virtual or spectating), the contest's name (cut
 * short), the rank when there is one, the time left, and a small badge with the unread announcements. It opens a small
 * popover with the contest's four links (the ones `ContestBar` has), the unread count and the clock; on a phone the chip
 * keeps the icon, the clock and the badge. It reads the participation `AppShell` already asks for and the
 * announcements `ContestBar` asks for, so it adds no request.
 */
const props = defineProps<{ current: CurrentParticipation }>();
const { t } = useI18n();
const locale = useLocaleStore();
/** The viewer's place; none for a spectator, a hidden board or a frozen one (the board shows no live place during a freeze). */
const rank = computed(() =>
  props.current.standing?.frozen ? null : (props.current.standing?.rank ?? null),
);
const kind = computed(() => participationKind(props.current.participation.virtual));
const STATE_ICON = { live: Radio, virtual: History, spectate: Eye } as const;
const statusText = computed(() => {
  if (kind.value === 'virtual')
    return t('contestBar.virtual', { run: props.current.participation.virtual });
  return t(kind.value === 'spectate' ? 'contestBar.spectate' : 'contestBar.live');
});
const stateIcon = computed(() => STATE_ICON[kind.value]);
const contestKey = computed(() => props.current.contest.key);
const unread = useUnreadAnnouncementCount(contestKey);
const popover = useTemplateRef('popover');
const links = computed(() =>
  CONTEST_LINK_ROUTES.map(({ name, tab }) => ({ name, label: t(`contests.tabs.${tab}`) })),
);
const unreadLabel = computed(() =>
  t('contests.announcements.unread', { count: unread.value }, unread.value),
);
</script>

<template>
  <AppButton
    tone="plain"
    data-testid="top-bar-live-contest"
    :title="current.contest.name"
    aria-haspopup="dialog"
    class="relative inline-flex h-(--qh-control) min-w-0 items-center gap-2 rounded-control px-2 text-sm font-semibold text-content hover:bg-surface-hover touch:h-11"
    @click="popover?.toggle($event)"
  >
    <component :is="stateIcon" aria-hidden="true" class="size-4 shrink-0 text-positive" />
    <span data-testid="top-bar-live-state" class="shrink-0 text-meta max-md:sr-only">{{
      statusText
    }}</span>
    <span class="hidden max-w-40 truncate lg:inline">{{ current.contest.name }}</span>
    <span v-if="rank !== null" class="shrink-0 font-mono text-meta text-secondary max-md:sr-only"
      >#{{ formatNumber(rank, locale.locale) }}</span
    >
    <CountdownTimer
      :key="current.participation.endTime"
      :until="current.participation.endTime"
      class="shrink-0 text-meta text-secondary"
    />
    <span
      v-if="unread > 0"
      data-testid="top-bar-live-unread"
      class="inline-flex min-w-5 items-center justify-center rounded-pill bg-accent px-1.5 text-tiny font-semibold text-on-accent tabular-nums"
    >
      <span aria-hidden="true">{{ unread }}</span>
      <span class="sr-only">{{ unreadLabel }}</span>
    </span>
  </AppButton>
  <Popover ref="popover" :label="current.contest.name">
    <p class="m-0 text-meta text-secondary">{{ statusText }} · {{ current.contest.name }}</p>
    <p class="mt-1 mb-2 font-bold text-content">
      <span class="sr-only">{{ $t('ranking.timeLeft') }}</span>
      <CountdownTimer :key="current.participation.endTime" :until="current.participation.endTime" />
    </p>
    <nav :aria-label="$t('contestBar.label')">
      <ul class="m-0 flex list-none flex-col gap-0.5 p-0">
        <li v-for="link in links" :key="link.name">
          <RouterLink
            :to="{ name: link.name, params: { key: contestKey } }"
            class="flex min-w-44 items-center justify-between gap-3 rounded-control px-2 py-1.5 text-sm font-semibold text-content hover:bg-surface-hover touch:min-h-11"
            @click="popover?.hide()"
          >
            {{ link.label }}
            <span
              v-if="link.name === 'contest-announcements' && unread > 0"
              data-testid="top-bar-live-menu-unread"
              class="inline-flex min-w-5 items-center justify-center rounded-pill bg-accent px-1.5 text-tiny font-semibold text-on-accent tabular-nums"
            >
              <span aria-hidden="true">{{ unread }}</span>
              <span class="sr-only">{{ unreadLabel }}</span>
            </span>
          </RouterLink>
        </li>
      </ul>
    </nav>
  </Popover>
</template>
