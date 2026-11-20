<script setup lang="ts">
import { LogOut } from 'lucide-vue-next';
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import AppButton from '@/components/ui/AppButton.vue';
import Drawer from '@/components/ui/Drawer.vue';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';
import ModeChoice from '@/features/appearance/ModeChoice.vue';
import { useLogout } from '@/features/auth/use-logout';
import OfficialModePill from '@/features/official-mode/OfficialModePill.vue';
import type { Locale } from '@/i18n';
import { ratingTextClass } from '@/lib/tier-classes';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { useIsFirstNavigationPending } from '@/router/first-navigation';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { useAccountLinks } from './account-links';
import { MENU_ITEMS, useIsNavCurrent, useNavLinkEvents } from './nav-items';

/**
 * The sheet behind the tab bar's "Tôi" (`TabBar`, which owns the button). It rises from the bottom: the menu's sections (the current one marked), then what the
 * desktop row shows beside the navigation: the official-mode pill, the account (who is signed in, its pages in the
 * desktop menu's order and sign-out, or register for a visitor; sign-in and the bell stay in the header), the language
 * and the light/dark mode (the rest of the look is one link away). The drawer traps focus and closes on Esc; any
 * navigation closes it; focus goes back to the tab that opened it (the kit `Drawer`).
 */
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
const isOpen = defineModel<boolean>('open', { required: true });
const isCurrent = useIsNavCurrent();
const linkEvents = useNavLinkEvents();
watch(
  () => route.fullPath,
  () => (isOpen.value = false),
);
</script>

<template>
  <Drawer v-model:visible="isOpen" side="bottom" :title="$t('nav.menu')">
    <nav :aria-label="$t('nav.main')">
      <RouterLink
        v-for="item in MENU_ITEMS"
        :key="item.path"
        :to="item.path"
        :aria-current="isCurrent(item.path) ? 'page' : undefined"
        :class="[ROW, isCurrent(item.path) ? 'bg-accent-soft font-bold text-accent-text' : '']"
        v-on="linkEvents(item.path)"
      >
        <component :is="item.icon" aria-hidden="true" class="size-5 shrink-0" />
        {{ $t(item.labelKey) }}
      </RouterLink>
    </nav>
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
      <ModeChoice />
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
      <AppButton v-else-if="!isSessionPending" block tone="primary" :to="{ name: 'register' }">
        {{ $t('account.register') }}
      </AppButton>
    </template>
  </Drawer>
</template>
