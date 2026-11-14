<script setup lang="ts">
import { Menu, UserRound } from 'lucide-vue-next';
import { ref } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import { usePublishedHeight } from '@/features/problems/use-dock-height';
import { useSessionStore } from '@/stores/session.store';
import { NAV_ITEMS, useIsNavCurrent, useNavLinkEvents } from './nav-items';
import PhoneMenu from './PhoneMenu.vue';

/**
 * The phone's navigation, under `md`: four sections and "Tôi" (a visitor's "Menu"), which opens the sheet with the
 * other three sections, the account, the language and the mode (`PhoneMenu`). 56 px tall plus the home-bar inset;
 * its height is published as `--tab-bar-height` so the submit bar, the save bar, toasts and the footer sit above it.
 */
const TAB_PATHS = ['/', '/problems', '/contests', '/submissions'];
const TABS = NAV_ITEMS.filter((item) => TAB_PATHS.includes(item.path));
const TAB =
  'flex h-14 w-full flex-col items-center justify-center gap-0.5 text-tiny leading-4 font-semibold transition-colors';

const session = useSessionStore();
const isCurrent = useIsNavCurrent();
const linkEvents = useNavLinkEvents();
const isMenuOpen = ref(false);
const root = ref<HTMLElement | null>(null);
usePublishedHeight(root, '--tab-bar-height');
</script>

<template>
  <nav
    ref="root"
    :aria-label="$t('nav.main')"
    data-testid="tab-bar"
    class="fixed inset-x-0 bottom-0 z-header border-t border-line bg-surface-solid pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] md:hidden print:hidden"
  >
    <ul class="m-0 grid list-none grid-cols-5 p-0">
      <li v-for="item in TABS" :key="item.path">
        <RouterLink
          :to="item.path"
          :aria-current="isCurrent(item.path) ? 'page' : undefined"
          :class="[
            TAB,
            isCurrent(item.path) ? 'text-accent-text' : 'text-muted hover:text-content',
          ]"
          v-on="linkEvents(item.path)"
        >
          <component :is="item.icon" aria-hidden="true" class="size-5" />
          {{ $t(item.labelKey) }}
        </RouterLink>
      </li>
      <li>
        <AppButton
          tone="plain"
          data-testid="phone-menu"
          aria-haspopup="dialog"
          :aria-expanded="isMenuOpen"
          :class="[TAB, 'text-muted hover:text-content']"
          @click="isMenuOpen = true"
        >
          <UserRound v-if="session.user" aria-hidden="true" class="size-5" />
          <Menu v-else aria-hidden="true" class="size-5" />
          {{ session.user ? $t('nav.me') : $t('nav.menu') }}
        </AppButton>
      </li>
    </ul>
  </nav>
  <PhoneMenu v-model:open="isMenuOpen" />
</template>
