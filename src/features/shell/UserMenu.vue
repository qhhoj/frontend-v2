<script setup lang="ts">
import { LogOut } from 'lucide-vue-next';
import Menu from 'primevue/menu';
import type { MenuItem } from 'primevue/menuitem';
import { computed, ref } from 'vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { ratingTextClass } from '@/lib/tier-classes';
import { useRoute } from 'vue-router';
import { useLogout } from '@/features/auth/use-logout';
import { useIsFirstNavigationPending } from '@/router/first-navigation';
import { translate } from '@/i18n';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { useSessionStore } from '@/stores/session.store';
import { useAccountLinks } from './account-links';

const session = useSessionStore();
const route = useRoute();
const logout = useLogout();
/** Until the session answers, a neutral pill: never "Đăng nhập" for a viewer who may be signed in. */
const isSessionPending = useIsFirstNavigationPending();
const menu = ref<InstanceType<typeof Menu>>();
const isOpen = ref(false);

const links = useAccountLinks();

/** Pages are real links (`to`, rendered by the item slot below); sign-out is a command. */
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
    <button
      type="button"
      class="flex h-11 max-w-[9rem] items-center gap-2.5 sm:max-w-[12rem] rounded-pill border border-line bg-surface-strong pr-1.5 pl-4 text-sm font-semibold hover:bg-surface-hover"
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
    </button>
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
    class="h-11 w-36"
  />
  <div v-else class="flex items-center gap-2">
    <AppButton :to="{ name: 'login', query: { redirect: route.fullPath } }">
      {{ $t('account.login') }}
    </AppButton>
    <AppButton tone="primary" :to="{ name: 'register' }">{{ $t('account.register') }}</AppButton>
  </div>
</template>
