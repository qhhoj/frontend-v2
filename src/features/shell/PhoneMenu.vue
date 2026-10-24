<script setup lang="ts">
import { Bell, LogOut, Menu } from 'lucide-vue-next';
import Drawer from 'primevue/drawer';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppButton from '@/components/ui/AppButton.vue';
import BrandWordmark from '@/components/ui/BrandWordmark.vue';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';
import ModeChoice from '@/features/appearance/ModeChoice.vue';
import { useLogout } from '@/features/auth/use-logout';
import { unreadBadge } from '@/features/notifications/use-notification-alerts';
import OfficialModePill from '@/features/official-mode/OfficialModePill.vue';
import { translate } from '@/i18n';
import type { Locale } from '@/i18n';
import { ratingTextClass } from '@/lib/tier-classes';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { useIsFirstNavigationPending } from '@/router/first-navigation';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { useAccountLinks } from './account-links';

/**
 * The phone header's menu. A sheet drops from the top with what the desktop row shows beside the navigation:
 * the language, the light/dark mode (the rest of the look is one link away), the official-mode pill and the account
 * (who is signed in, then its pages in the desktop menu's order and sign-out, or sign-in and register), and for a
 * signed-in viewer the notifications with their unread count, which a dot on the menu button signals too. Any
 * navigation closes it; focus goes back to the menu button.
 */
const props = defineProps<{ unread: number }>();
const LANGUAGES: ReadonlyArray<{ value: Locale; label: string }> = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
];
const ROW =
  'flex min-h-11 items-center gap-3 rounded-pill px-3 font-semibold hover:bg-surface-hover';
const HEADING = 'mb-2 text-sm font-semibold text-muted';

const session = useSessionStore();
const locale = useLocaleStore();
const route = useRoute();
const links = useAccountLinks();
const logout = useLogout();
/** Until the session answers the sheet offers neither sign-out nor sign-in. */
const isSessionPending = useIsFirstNavigationPending();
const isOpen = ref(false);
const badge = computed(() => unreadBadge(props.unread, locale.locale));
const hasUnread = computed(() => session.user !== null && props.unread > 0);
const opener = ref<HTMLButtonElement | null>(null);
watch(
  () => route.fullPath,
  () => (isOpen.value = false),
);

/**
 * Drawer is unstyled: these classes are its whole look (a card under the top edge, the page dimmed below). Computed, so
 * its name follows a language switched from inside it.
 */
const drawerPt = computed(() => ({
  root: {
    class:
      'flex max-h-full w-full flex-col rounded-card border border-line-strong bg-surface-solid text-content',
    'aria-label': translate('nav.menu'),
  },
  header: { class: 'flex items-center justify-between gap-3 px-4 pt-2' },
  pcCloseButton: {
    root: {
      class: 'inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-hover',
    },
  },
  content: { class: 'flex flex-col gap-4 overflow-y-auto px-4 py-3' },
  footer: { class: 'px-4 pb-4' },
  mask: { class: 'page-gutter fixed inset-0 z-50 flex items-start bg-ground/70 py-2' },
}));
</script>

<template>
  <button
    ref="opener"
    type="button"
    data-testid="phone-menu"
    class="relative inline-flex size-11 items-center justify-center rounded-pill border border-line bg-surface-strong hover:bg-surface-hover"
    aria-haspopup="dialog"
    :aria-expanded="isOpen"
    :aria-label="hasUnread ? $t('nav.openMenuUnread', { count: unread }) : $t('nav.openMenu')"
    @click="isOpen = true"
  >
    <Menu aria-hidden="true" class="size-5" />
    <span
      v-if="hasUnread"
      aria-hidden="true"
      data-testid="phone-menu-dot"
      class="absolute top-1.5 right-1.5 size-2.5 rounded-pill bg-accent ring-2 ring-surface-strong"
    />
  </button>
  <Drawer
    v-model:visible="isOpen"
    position="top"
    :pt="drawerPt"
    :close-button-props="{ 'aria-label': $t('common.close') }"
    @hide="opener?.focus()"
  >
    <template #header><BrandWordmark /></template>
    <OfficialModePill class="self-start" />
    <section
      v-if="session.user"
      :aria-label="$t('account.menu', { username: session.user.username })"
    >
      <div
        data-testid="phone-menu-identity"
        class="flex min-h-11 items-center gap-3 px-3 font-semibold"
      >
        <UserAvatar :username="session.user.username" :size="28" class="shrink-0" />
        <span :class="['min-w-0 truncate', ratingTextClass(session.user.rating)]">{{
          session.user.username
        }}</span>
      </div>
      <RouterLink v-for="link in links" :key="link.labelKey" :to="link.to" :class="ROW">
        <component :is="link.icon" aria-hidden="true" class="size-5 text-muted" />
        {{ $t(link.labelKey) }}
      </RouterLink>
      <RouterLink
        :to="{ name: 'notifications' }"
        :class="ROW"
        data-testid="phone-menu-notifications"
      >
        <Bell aria-hidden="true" class="size-5 text-muted" />
        <span class="flex-1">{{ $t('notifications.drawerTitle') }}</span>
        <template v-if="badge">
          <span
            aria-hidden="true"
            class="min-w-5 rounded-pill bg-accent px-1.5 text-center text-xs leading-5 font-bold text-on-accent"
            >{{ badge }}</span
          >
          <span class="sr-only">{{ $t('notifications.unreadCount', { count: unread }) }}</span>
        </template>
      </RouterLink>
    </section>
    <div>
      <p :class="HEADING">{{ $t('locale.title') }}</p>
      <SegmentedControl
        :label="$t('locale.title')"
        :options="LANGUAGES"
        :model-value="locale.locale"
        @update:model-value="(value) => (locale.locale = value)"
      />
    </div>
    <div>
      <p :class="HEADING">{{ $t('appearance.title') }}</p>
      <ModeChoice mode-only />
      <RouterLink
        :to="{ name: 'settings-appearance' }"
        class="mt-1 inline-flex min-h-11 items-center text-meta text-accent-text underline"
        >{{ $t('appearance.moreSettings') }}</RouterLink
      >
    </div>
    <template #footer>
      <AppButton v-if="session.user" block @click="logout()">
        <template #icon><LogOut class="size-4" aria-hidden="true" /></template>
        {{ $t('account.logout') }}
      </AppButton>
      <div v-else-if="!isSessionPending" class="grid grid-cols-2 gap-2">
        <AppButton block :to="{ name: 'login', query: { redirect: route.fullPath } }">
          {{ $t('account.login') }}
        </AppButton>
        <AppButton block tone="primary" :to="{ name: 'register' }">
          {{ $t('account.register') }}
        </AppButton>
      </div>
    </template>
  </Drawer>
</template>
