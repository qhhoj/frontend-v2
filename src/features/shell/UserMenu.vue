<script setup lang="ts">
import { ChevronsUpDown, LogIn, LogOut } from 'lucide-vue-next';
import Menu from 'primevue/menu';
import type { MenuItem } from 'primevue/menuitem';
import { computed, ref } from 'vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AppButton from '@/components/ui/AppButton.vue';
import IconButton from '@/components/ui/IconButton.vue';
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
  'flex min-h-11 w-full items-center gap-2.5 rounded-row px-2 text-left text-sm font-semibold transition-colors hover:bg-surface-hover max-rail-wide:justify-center max-rail-wide:px-0';
const session = useSessionStore();
const route = useRoute();
const logout = useLogout();
/** Until the session answers, a neutral pill: never "Đăng nhập" for a viewer who may be signed in. */
const isSessionPending = useIsFirstNavigationPending();
const menu = ref<InstanceType<typeof Menu>>();
const isOpen = ref(false);

const links = useAccountLinks();

/** Pages are real links (`to`, rendered by the item slot below, so a modified click opens a tab); sign-out is a command. */
const items = computed<MenuItem[]>(() => [
  ...links.value.map((link) => ({
    label: translate(link.labelKey),
    rowIcon: link.icon,
    to: link.to,
  })),
  { separator: true },
  { label: translate('account.logout'), rowIcon: LogOut, command: () => void logout() },
]);
</script>

<template>
  <template v-if="session.user">
    <AppButton
      v-if="variant === 'row'"
      tone="plain"
      :class="ROW_TRIGGER"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      :aria-label="$t('account.menu', { username: session.user.username })"
      :title="session.user.username"
      @click="menu?.toggle($event)"
    >
      <UserAvatar :username="session.user.username" :size="28" class="shrink-0" />
      <span
        :class="[
          'min-w-0 flex-1 truncate max-rail-wide:sr-only',
          ratingTextClass(session.user.rating),
        ]"
        >{{ session.user.username }}</span
      >
      <ChevronsUpDown aria-hidden="true" class="size-4 shrink-0 text-muted max-rail-wide:hidden" />
    </AppButton>
    <AppButton
      v-else
      tone="secondary"
      class="max-w-36 gap-2.5 pr-1.5 pl-4 sm:max-w-48"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      :aria-label="$t('account.menu', { username: session.user.username })"
      @click="menu?.toggle($event)"
    >
      <span
        :class="['min-w-0 truncate', ratingTextClass(session.user.rating)]"
        :title="session.user.username"
        >{{ session.user.username }}</span
      >
      <UserAvatar :username="session.user.username" :size="28" class="shrink-0" />
    </AppButton>
    <Menu ref="menu" :model="items" popup @show="isOpen = true" @hide="isOpen = false">
      <template #item="{ item, props: itemProps }">
        <RouterLink v-if="item.to" v-slot="{ href, navigate }" :to="item.to" custom>
          <a v-bind="itemProps.action" :href="href" @click="navigate">
            <component :is="item.rowIcon" aria-hidden="true" class="size-4 shrink-0 text-muted" />
            {{ item.label }}
          </a>
        </RouterLink>
        <a v-else v-bind="itemProps.action">
          <component :is="item.rowIcon" aria-hidden="true" class="size-4 shrink-0 text-muted" />
          {{ item.label }}
        </a>
      </template>
    </Menu>
  </template>
  <SkeletonBlock
    v-else-if="isSessionPending"
    pill
    data-testid="account-placeholder"
    :class="variant === 'row' ? 'h-11 w-full' : 'h-11 w-36'"
  />
  <div v-else-if="variant === 'row'" class="flex flex-col gap-2">
    <IconButton
      class="rail-wide:hidden"
      tone="secondary"
      :label="$t('account.login')"
      :to="{ name: 'login', query: { redirect: route.fullPath } }"
    >
      <LogIn aria-hidden="true" />
    </IconButton>
    <AppButton
      class="max-rail-wide:hidden"
      block
      :to="{ name: 'login', query: { redirect: route.fullPath } }"
    >
      {{ $t('account.login') }}
    </AppButton>
    <AppButton
      class="max-rail-wide:hidden"
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
