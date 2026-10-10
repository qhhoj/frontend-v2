<script setup lang="ts">
import { computed } from 'vue';
import { CloudDownload, Plus, Trophy } from 'lucide-vue-next';
import { allowsAny } from '@/lib/permissions';
import { useSessionStore } from '@/stores/session.store';
import { ADMIN_SCREENS, adminRouteName } from '../admin-screens';
import AdminBit from './AdminBit.vue';
import { QUICK_ACTIONS, heldPermission, visibleDashboard } from './admin-nav';

const session = useSessionStore();
const sections = computed(() => visibleDashboard(session.user));
const ACTION_ICONS = {
  problemNew: Plus,
  polygonImport: CloudDownload,
  contestNew: Trophy,
} as const;
const actions = computed(() =>
  QUICK_ACTIONS.filter((id) => allowsAny(session.user, ADMIN_SCREENS[id].permission)),
);
</script>

<template>
  <div data-testid="admin-dashboard" class="flex flex-col gap-6">
    <header>
      <h1 class="page-title">{{ $t('admin.shell.screens.dashboard') }}</h1>
      <p class="text-muted">{{ $t('admin.shell.dashboard.lead') }}</p>
    </header>
    <section class="glass flex flex-wrap items-center gap-4 rounded-panel p-5">
      <AdminBit placement="greeting" />
      <div class="min-w-0 flex-1">
        <h2 class="font-display text-xl font-semibold">
          {{ $t('admin.shell.dashboard.hello', { name: session.user?.username }) }}
        </h2>
        <p class="text-sm text-muted">{{ $t('admin.shell.dashboard.helloBody') }}</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <RouterLink
          v-for="(id, index) in actions"
          :key="id"
          :to="{ name: adminRouteName(id) }"
          class="inline-flex min-h-11 items-center gap-2 rounded-pill px-4 text-sm font-semibold"
          :class="
            index === 0
              ? 'bg-gradient-accent text-on-accent'
              : 'border border-line-strong bg-surface-solid'
          "
        >
          <component
            :is="ACTION_ICONS[id as keyof typeof ACTION_ICONS]"
            aria-hidden="true"
            class="size-4"
          />
          {{ $t(`admin.shell.dashboard.actions.${id}`) }}
        </RouterLink>
      </div>
    </section>
    <section v-for="entry in sections" :key="entry.labelKey" class="flex flex-col gap-3">
      <h2 class="font-display text-base font-bold">{{ $t(entry.labelKey) }}</h2>
      <ul class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <li v-for="item in entry.items" :key="item.id">
          <RouterLink
            :to="{ name: item.routeName }"
            class="glass flex h-full flex-col gap-2 rounded-card p-4 hover:bg-surface-hover"
          >
            <component :is="item.icon" aria-hidden="true" class="size-5 text-accent" />
            <span class="font-semibold">{{ $t(item.labelKey) }}</span>
            <span class="text-sm text-muted">
              {{ $t(`admin.shell.dashboard.descriptions.${item.id}`) }}
            </span>
            <span class="mt-auto flex flex-wrap items-center gap-2 text-xs">
              <span
                v-if="heldPermission(item.permission, session.user)"
                class="rounded-pill border border-line px-2 py-0.5"
              >
                {{ heldPermission(item.permission, session.user) }}
              </span>
              <span class="font-mono text-muted">{{ item.path }}</span>
            </span>
          </RouterLink>
        </li>
      </ul>
    </section>
  </div>
</template>
