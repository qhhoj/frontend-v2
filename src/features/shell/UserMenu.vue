<script setup lang="ts">
import Menu from 'primevue/menu';
import type { MenuItem } from 'primevue/menuitem';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLogout } from '@/features/auth/use-logout';
import { translate } from '@/i18n';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { useSessionStore } from '@/stores/session.store';

const session = useSessionStore();
const route = useRoute();
const router = useRouter();
const logout = useLogout();
const menu = ref<InstanceType<typeof Menu>>();
const isOpen = ref(false);

const items = computed<MenuItem[]>(() => [
  { label: translate('account.settings'), command: () => void router.push({ name: 'settings' }) },
  ...(session.isStaff
    ? [{ label: translate('account.admin'), command: () => void router.push('/admin') }]
    : []),
  { separator: true },
  { label: translate('account.logout'), command: () => void logout() },
]);
</script>

<template>
  <template v-if="session.user">
    <button
      type="button"
      class="flex h-11 items-center gap-2.5 rounded-pill border border-line bg-surface-strong pr-1.5 pl-4 text-sm font-semibold hover:bg-surface-hover"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      :aria-label="$t('account.menu', { username: session.user.username })"
      @click="menu?.toggle($event)"
    >
      {{ session.user.username }}
      <UserAvatar :username="session.user.username" :size="28" />
    </button>
    <Menu ref="menu" :model="items" popup @show="isOpen = true" @hide="isOpen = false" />
  </template>
  <div v-else class="flex items-center gap-2">
    <RouterLink
      :to="{ name: 'login', query: { redirect: route.fullPath } }"
      class="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface-strong px-4 text-sm font-semibold hover:bg-surface-hover"
    >
      {{ $t('account.login') }}
    </RouterLink>
    <RouterLink
      :to="{ name: 'register' }"
      class="bg-gradient-accent inline-flex min-h-11 items-center rounded-pill px-4 text-sm font-bold text-on-accent"
    >
      {{ $t('account.register') }}
    </RouterLink>
  </div>
</template>
