<script setup lang="ts">
import { PanelLeftClose, PanelLeftOpen, Search } from 'lucide-vue-next';
import BitSprite from '@/components/BitSprite.vue';
import AppButton from '@/components/ui/AppButton.vue';
import BrandWordmark from '@/components/ui/BrandWordmark.vue';
import IconButton from '@/components/ui/IconButton.vue';
import StatusDot from '@/components/ui/StatusDot.vue';
import AppearancePanel from '@/features/appearance/AppearancePanel.vue';
import NotificationBell from '@/features/notifications/NotificationBell.vue';
import type { CurrentParticipation } from '@/api/types/contests';
import OfficialModePill from '@/features/official-mode/OfficialModePill.vue';
import type { BitLook } from '@/mascot/bit-sprite';
import LocaleToggle from './LocaleToggle.vue';
import { MENU_ITEMS, useIsNavCurrent, useNavLinkEvents } from './nav-items';
import RailLiveContest from './RailLiveContest.vue';
import RailNextContest from './RailNextContest.vue';
import { useNextContest } from './use-next-contest';
import { shortcutHint } from '@/lib/shortcut-hint';
import { PHONE_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { useRailCollapse } from './use-rail-collapse';
import UserMenu from './UserMenu.vue';

/**
 * The desktop rail, from `md` up: the brand, the search button (Ctrl K), the menu's sections (Kỳ thi with its count of
 * running contests), the contest the viewer is taking part in (or else the next one to look at), and at the foot one row of icons (bell, language, look,
 * collapse; stacked in the narrow column) over the account. 224 px from 1100 px
 * (`rail-open`); below that, or when the viewer collapses it (button at the foot, `[`; AppShell sets `data-rail`), a 56 px
 * column of icons (44 px targets) whose labels stay their accessible names and tooltips. Opaque: the page background is
 * drawn behind `main` only.
 */
defineProps<{ current: CurrentParticipation | null }>();
const emit = defineEmits<{ search: [] }>();
const isCurrent = useIsNavCurrent();
const linkEvents = useNavLinkEvents();
const { runningCount, next } = useNextContest();
const { isCollapsed, toggle } = useRailCollapse();
/** Below `md` the rail is hidden by CSS: its bell, language and look controls are not mounted then, so the phone's top bar owns the only bell. */
const isPhone = useMediaQuery(PHONE_QUERY);
const BIT: BitLook = { headgear: 'none', palette: 'terracotta' };

/** One row: a control tall (36 px) for a mouse, 44 on touch; the current section is a soft brand ground, brand text and a 3 px brand bar on the left. */
const ROW =
  'relative flex min-h-(--qh-control) items-center gap-3 rounded-control px-(--qh-control-px-sm) text-body font-semibold text-secondary transition-colors hover:bg-surface-hover hover:text-content touch:min-h-11 rail-slim:justify-center rail-slim:px-0';
const CURRENT_ROW =
  "overflow-hidden bg-accent-soft! font-bold text-accent-text! before:absolute before:inset-y-0 before:left-0 before:w-0.75 before:bg-accent before:content-['']";
</script>

<template>
  <aside
    data-testid="app-rail"
    :aria-label="$t('nav.rail')"
    class="sticky top-0 hidden h-dvh w-14 shrink-0 flex-col gap-3 overflow-x-hidden overflow-y-auto border-r border-line bg-surface-strong px-1 py-2 transition-[width] duration-(--qh-duration) ease-standard md:flex rail-open:w-(--qh-rail) rail-open:px-3 print:hidden"
  >
    <div class="flex min-h-11 items-center px-1 rail-slim:justify-center rail-slim:px-0">
      <BrandWordmark size="sm" class="rail-slim:hidden" />
      <RouterLink
        to="/"
        :aria-label="$t('app.name')"
        :title="$t('app.name')"
        class="inline-flex size-11 items-center justify-center rail-open:hidden"
        style="--bit-px: 2px"
      >
        <BitSprite :look="BIT" />
      </RouterLink>
    </div>
    <OfficialModePill class="self-start rail-slim:hidden" />
    <AppButton
      tone="plain"
      data-testid="rail-search"
      aria-keyshortcuts="Control+K Meta+K"
      :aria-label="$t('search.title')"
      :title="$t('search.title')"
      class="flex h-(--qh-control) items-center gap-2 rounded-control bg-surface px-(--qh-control-px-sm) text-body text-muted transition-colors hover:text-content touch:h-11 rail-slim:justify-center rail-slim:px-0"
      @click="emit('search')"
    >
      <Search aria-hidden="true" class="size-4 shrink-0" />
      <span class="flex-1 text-left rail-slim:sr-only">{{ $t('search.title') }}</span>
      <kbd
        class="rounded-cell bg-surface-strong px-1.5 font-mono text-kbd leading-5 rail-slim:hidden"
        >{{ shortcutHint() }}</kbd
      >
    </AppButton>
    <nav :aria-label="$t('nav.main')" class="flex flex-col gap-0.5">
      <RouterLink
        v-for="item in MENU_ITEMS"
        :key="item.path"
        :to="item.path"
        :title="
          item.path === '/contests' && runningCount > 0
            ? `${$t(item.labelKey)} · ${$t('nav.runningCount', { count: runningCount })}`
            : $t(item.labelKey)
        "
        :aria-current="isCurrent(item.path) ? 'page' : undefined"
        :class="[ROW, isCurrent(item.path) && CURRENT_ROW]"
        v-on="linkEvents(item.path)"
      >
        <component :is="item.icon" aria-hidden="true" class="size-4 shrink-0" />
        <span class="min-w-0 flex-1 truncate rail-slim:sr-only">{{ $t(item.labelKey) }}</span>
        <span
          v-if="item.path === '/contests' && runningCount > 0"
          data-testid="rail-running-count"
          class="shrink-0 text-caption leading-4 font-semibold text-positive rail-slim:sr-only"
          >{{ $t('nav.runningCount', { count: runningCount }) }}</span
        >
        <!-- Nothing runs but a contest is coming: a blue dot, no count. -->
        <StatusDot
          v-if="item.path === '/contests' && runningCount === 0 && next"
          tone="upcoming"
          :label="$t('rail.next.upcomingDot')"
          class="rail-slim:hidden"
        />
        <StatusDot
          v-if="item.path === '/contests' && runningCount === 0 && next"
          tone="upcoming"
          class="absolute top-1.5 right-2 rail-open:hidden"
        />
        <!-- The narrow rail has no room for the count: a dot on the icon, the count stays its accessible text. -->
        <span
          v-if="item.path === '/contests' && runningCount > 0"
          aria-hidden="true"
          class="absolute top-1.5 right-2 size-1.5 rounded-full bg-positive rail-open:hidden"
        />
      </RouterLink>
    </nav>
    <RailNextContest v-if="!current && next" :next="next" />
    <RailLiveContest v-if="current" :current="current" class="mt-auto" />
    <div :class="['flex flex-col gap-1 border-t border-line pt-2', !current && 'mt-auto']">
      <!-- Icons stay 24 px; each button is a 44 px target (the rail's 48 px inner width fits it). -->
      <div
        v-if="!isPhone"
        class="flex items-center gap-1 rail-slim:flex-col [&>button]:min-h-11! [&>button]:min-w-11!"
      >
        <NotificationBell compact />
        <LocaleToggle compact />
        <AppearancePanel compact />
        <!-- Only where the full rail can show (from 1100 px); narrower, the column is always icons. -->
        <IconButton
          compact
          data-testid="rail-collapse"
          aria-keyshortcuts="["
          :aria-expanded="!isCollapsed"
          :label="`${$t(isCollapsed ? 'nav.railExpand' : 'nav.railCollapse')} ([)`"
          class="ml-auto max-rail-wide:hidden rail-slim:ml-0"
          @click="toggle"
        >
          <component :is="isCollapsed ? PanelLeftOpen : PanelLeftClose" aria-hidden="true" />
        </IconButton>
      </div>
      <UserMenu variant="row" />
    </div>
  </aside>
</template>
