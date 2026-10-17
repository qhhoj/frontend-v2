<script setup lang="ts">
import Menu from 'primevue/menu';
import type { MenuItem } from 'primevue/menuitem';
import { computed, ref } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import { ratingTextClass } from '@/lib/tier-classes';
import { useRoute, useRouter } from 'vue-router';
import { useLogout } from '@/features/auth/use-logout';
import { translate } from '@/i18n';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { useSessionStore } from '@/stores/session.store';
import { useAccountLinks } from './account-links';

const session = useSessionStore();
const route = useRoute();
const router = useRouter();
const logout = useLogout();
const menu = ref<InstanceType<typeof Menu>>();
const isOpen = ref(false);

const links = useAccountLinks();

const items = computed<MenuItem[]>(() => [
  ...links.value.map((link) => ({
    label: translate(link.labelKey),
    command: () => void router.push(link.to),
  })),
  { separator: true },
  { label: translate('account.logout'), command: () => void logout() },
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
    <Menu ref="menu" :model="items" popup @show="isOpen = true" @hide="isOpen = false" />
  </template>
  <div v-else class="flex items-center gap-2">
    <AppButton :to="{ name: 'login', query: { redirect: route.fullPath } }">
      {{ $t('account.login') }}
    </AppButton>
    <AppButton tone="primary" :to="{ name: 'register' }">{{ $t('account.register') }}</AppButton>
  </div>
</template>
