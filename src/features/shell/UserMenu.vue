<script setup lang="ts">
import { ChevronsUpDown, LogIn, LogOut } from 'lucide-vue-next';
import { computed } from 'vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AppButton from '@/components/ui/AppButton.vue';
import IconButton from '@/components/ui/IconButton.vue';
import Menu from '@/components/ui/Menu.vue';
import type { MenuEntry } from '@/components/ui/Menu.vue';
import { ratingTextClass } from '@/lib/tier-classes';
import { useRoute } from 'vue-router';
import { useLogout } from '@/features/auth/use-logout';
import { useIsFirstNavigationPending } from '@/router/first-navigation';
import { translate } from '@/i18n';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { useSessionStore } from '@/stores/session.store';
import { useAccountLinks } from './account-links';

/**
 * The account menu: a pill in the admin top bar, a full-width row at the foot of the public rail (`row`; only the avatar
 * while the rail is narrow). A visitor gets sign-in and register instead.
 */
withDefaults(defineProps<{ variant?: 'pill' | 'row' }>(), { variant: 'pill' });
const ROW_TRIGGER =
  'flex min-h-11 w-full items-center gap-2.5 rounded-row px-2 text-left text-sm font-semibold transition-colors hover:bg-surface-hover rail-slim:justify-center rail-slim:px-0';
const session = useSessionStore();
const route = useRoute();
const logout = useLogout();
/** Until the session answers, a neutral pill: never "Đăng nhập" for a viewer who may be signed in. */
const isSessionPending = useIsFirstNavigationPending();

const links = useAccountLinks();

/** Pages are real links (`to`, so a modified click opens a tab); sign-out is a command in its own group. */
const items = computed<MenuEntry[]>(() => [
  ...links.value.map((link) => ({ label: translate(link.labelKey), icon: link.icon, to: link.to })),
  { label: translate('account.logout'), icon: LogOut, run: () => void logout(), separated: true },
]);
/** The trigger is an AppButton; the menu returns focus to its element. */
const openerOf = (button: unknown) => (button as { $el?: HTMLElement } | null)?.$el ?? null;
</script>

<template>
  <Menu
    v-if="session.user"
    :items="items"
    :label="$t('account.menu', { username: session.user.username })"
  >
    <template #trigger="{ toggle, open, setOpener }">
      <AppButton
        v-if="variant === 'row'"
        :ref="(el) => setOpener(openerOf(el))"
        tone="plain"
        :class="ROW_TRIGGER"
        aria-haspopup="menu"
        :aria-expanded="open"
        :aria-label="$t('account.menu', { username: session.user.username })"
        :title="session.user.username"
        @click="toggle"
      >
        <UserAvatar :username="session.user.username" :size="28" class="shrink-0" />
        <span
          :class="[
            'min-w-0 flex-1 truncate rail-slim:sr-only',
            ratingTextClass(session.user.rating),
          ]"
          >{{ session.user.username }}</span
        >
        <ChevronsUpDown aria-hidden="true" class="size-4 shrink-0 text-muted rail-slim:hidden" />
      </AppButton>
      <AppButton
        v-else
        :ref="(el) => setOpener(openerOf(el))"
        tone="secondary"
        class="max-w-36 gap-2.5 pr-1.5 pl-4 sm:max-w-48"
        aria-haspopup="menu"
        :aria-expanded="open"
        :aria-label="$t('account.menu', { username: session.user.username })"
        @click="toggle"
      >
        <span
          :class="['min-w-0 truncate', ratingTextClass(session.user.rating)]"
          :title="session.user.username"
          >{{ session.user.username }}</span
        >
        <UserAvatar :username="session.user.username" :size="28" class="shrink-0" />
      </AppButton>
    </template>
  </Menu>
  <SkeletonBlock
    v-else-if="isSessionPending"
    pill
    data-testid="account-placeholder"
    :class="variant === 'row' ? 'h-11 w-full' : 'h-11 w-36'"
  />
  <div v-else-if="variant === 'row'" class="flex flex-col gap-2">
    <IconButton
      class="rail-open:hidden"
      tone="secondary"
      :label="$t('account.login')"
      :to="{ name: 'login', query: { redirect: route.fullPath } }"
    >
      <LogIn aria-hidden="true" />
    </IconButton>
    <AppButton
      class="rail-slim:hidden"
      block
      :to="{ name: 'login', query: { redirect: route.fullPath } }"
    >
      {{ $t('account.login') }}
    </AppButton>
    <AppButton
      class="rail-slim:hidden"
      block
      tone="primary"
      :to="{ name: 'register', query: { redirect: route.fullPath } }"
      >{{ $t('account.register') }}</AppButton
    >
  </div>
  <div v-else class="flex items-center gap-2">
    <AppButton :to="{ name: 'login', query: { redirect: route.fullPath } }">
      {{ $t('account.login') }}
    </AppButton>
    <AppButton tone="primary" :to="{ name: 'register', query: { redirect: route.fullPath } }">{{
      $t('account.register')
    }}</AppButton>
  </div>
</template>
