<script setup lang="ts">
import { computed } from 'vue';
import { CloudDownload, Plus, Trophy } from 'lucide-vue-next';
import { useSessionStore } from '@/stores/session.store';
import { canUseAdmin } from '../admin-access';
import { ADMIN_SCREENS, adminRouteName } from '../admin-screens';
import RecentChangesCard from '../audit/RecentChangesCard.vue';
import { buttonClass } from '../ui/controls';
import AdminBit from './AdminBit.vue';
import { QUICK_ACTIONS } from './admin-nav';
import OverviewTiles from './overview/OverviewTiles.vue';
import RecentScreens from './recent/RecentScreens.vue';

/**
 * The admin home (pages/admin.md, "Dashboard"): the greeting with the one staff Bit and the quick actions, what waits for
 * staff, then the recent changes beside this account's shortcuts. The sidebar lists every screen, so this page does not.
 */
const session = useSessionStore();
const ACTION_ICONS = {
  problemNew: Plus,
  polygonImport: CloudDownload,
  contestNew: Trophy,
} as const;
const actions = computed(() =>
  QUICK_ACTIONS.filter((id) => canUseAdmin(session.user, ADMIN_SCREENS[id])),
);
</script>

<template>
  <div data-testid="admin-dashboard" class="flex flex-col gap-6">
    <header class="flex flex-wrap items-center gap-x-4 gap-y-3">
      <AdminBit placement="greeting" />
      <div class="min-w-0 flex-1 basis-60">
        <h1 class="font-display text-xl font-semibold md:text-2xl">
          {{ $t('admin.shell.dashboard.hello', { name: session.user?.username }) }}
        </h1>
        <p class="text-sm text-muted">{{ $t('admin.shell.dashboard.lead') }}</p>
      </div>
      <div v-if="actions.length" class="flex flex-wrap gap-2">
        <RouterLink
          v-for="(id, index) in actions"
          :key="id"
          :to="{ name: adminRouteName(id) }"
          :class="buttonClass(index === 0 ? 'primary' : 'secondary')"
        >
          <component
            :is="ACTION_ICONS[id as keyof typeof ACTION_ICONS]"
            aria-hidden="true"
            class="size-4"
            :stroke-width="1.75"
          />
          {{ $t(`admin.shell.dashboard.actions.${id}`) }}
        </RouterLink>
      </div>
    </header>
    <OverviewTiles />
    <div class="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <RecentChangesCard />
      <RecentScreens />
    </div>
  </div>
</template>
