<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import BitSprite from '@/components/BitSprite.vue';
import AppButton from '@/components/ui/AppButton.vue';
import BrandWordmark from '@/components/ui/BrandWordmark.vue';
import type { CurrentParticipation } from '@/api/types/contests';
import OfficialModePill from '@/features/official-mode/OfficialModePill.vue';
import type { BitLook } from '@/mascot/bit-sprite';
import { NAV_ITEMS, useIsNavCurrent, useNavLinkEvents } from './nav-items';
import RailLiveContest from './RailLiveContest.vue';
import { useRunningContestCount } from './use-running-contest-count';
import { shortcutHint } from '@/lib/shortcut-hint';
import UserMenu from './UserMenu.vue';

/**
 * The desktop rail, from `md` up: the brand, the search button (Ctrl K), the seven sections (Kỳ thi with its count of
 * running contests), the contest the viewer is taking part in, and the account at the foot. 224 px from 1100 px
 * (`rail-wide`); below that a 56 px column of icons (44 px targets) whose labels stay their accessible names. Opaque: the page
 * background is drawn behind `main` only.
 */
defineProps<{ current: CurrentParticipation | null }>();
const emit = defineEmits<{ search: [] }>();
const isCurrent = useIsNavCurrent();
const linkEvents = useNavLinkEvents();
const runningCount = useRunningContestCount();
const BIT: BitLook = { headgear: 'none', palette: 'terracotta' };

/** One row: 36 px for a mouse, 44 on touch; the current section is a panel with an accent edge. */
const ROW =
  'relative flex min-h-9 items-center gap-3 rounded-row border border-transparent px-2.5 text-sm font-semibold text-secondary transition-colors hover:bg-surface-hover hover:text-content touch:min-h-11 max-rail-wide:justify-center max-rail-wide:px-0';
const CURRENT_ROW =
  "border-line bg-surface-solid text-content before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:rounded-pill before:bg-accent before:content-['']";
</script>

<template>
  <aside
    data-testid="app-rail"
    :aria-label="$t('nav.rail')"
    class="sticky top-0 hidden h-dvh w-14 shrink-0 flex-col gap-3 overflow-y-auto border-r border-line bg-surface-strong px-1 py-2 md:flex rail-wide:w-(--qh-rail) rail-wide:px-3 print:hidden"
  >
    <div class="flex min-h-11 items-center px-1 max-rail-wide:justify-center max-rail-wide:px-0">
      <BrandWordmark size="sm" class="max-rail-wide:hidden" />
      <RouterLink
        to="/"
        :aria-label="$t('app.name')"
        class="inline-flex size-11 items-center justify-center rail-wide:hidden"
        style="--bit-px: 2px"
      >
        <BitSprite :look="BIT" />
      </RouterLink>
    </div>
    <OfficialModePill class="self-start max-rail-wide:hidden" />
    <AppButton
      tone="plain"
      data-testid="rail-search"
      aria-keyshortcuts="Control+K Meta+K"
      :aria-label="$t('search.title')"
      :title="$t('search.title')"
      class="flex h-9 items-center gap-2 rounded-control border border-line-control bg-surface-solid px-2.5 text-sm text-muted transition-colors hover:text-content touch:h-11 max-rail-wide:justify-center max-rail-wide:px-0"
      @click="emit('search')"
    >
      <Search aria-hidden="true" class="size-4 shrink-0" />
      <span class="flex-1 text-left max-rail-wide:sr-only">{{ $t('search.title') }}</span>
      <kbd
        class="rounded-cell border border-line px-1.5 font-mono text-caption leading-5 max-rail-wide:hidden"
        >{{ shortcutHint() }}</kbd
      >
    </AppButton>
    <nav :aria-label="$t('nav.main')" class="flex flex-col gap-0.5">
      <RouterLink
        v-for="item in NAV_ITEMS"
        :key="item.path"
        :to="item.path"
        :title="$t(item.labelKey)"
        :aria-current="isCurrent(item.path) ? 'page' : undefined"
        :class="[ROW, isCurrent(item.path) && CURRENT_ROW]"
        v-on="linkEvents(item.path)"
      >
        <component :is="item.icon" aria-hidden="true" class="size-4 shrink-0" />
        <span class="min-w-0 flex-1 truncate max-rail-wide:sr-only">{{ $t(item.labelKey) }}</span>
        <span
          v-if="item.path === '/contests' && runningCount > 0"
          data-testid="rail-running-count"
          class="shrink-0 text-caption leading-4 font-semibold text-positive max-rail-wide:sr-only"
          >{{ $t('nav.runningCount', { count: runningCount }) }}</span
        >
        <!-- The narrow rail has no room for the count: a dot on the icon, the count stays its accessible text. -->
        <span
          v-if="item.path === '/contests' && runningCount > 0"
          aria-hidden="true"
          class="absolute top-1.5 right-2 size-1.5 rounded-full bg-positive rail-wide:hidden"
        />
      </RouterLink>
    </nav>
    <RailLiveContest v-if="current" :current="current" class="mt-auto" />
    <div :class="['border-t border-line pt-2', !current && 'mt-auto']">
      <UserMenu variant="row" />
    </div>
  </aside>
</template>
