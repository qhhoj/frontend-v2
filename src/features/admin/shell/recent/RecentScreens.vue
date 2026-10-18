<script setup lang="ts">
import { History } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session.store';
import { canUseAdmin } from '../../admin-access';
import { shortcutsOf, useRecentScreens } from './recent-screens';

const router = useRouter();
const session = useSessionStore();
const { recent } = useRecentScreens();
/**
 * "Lối tắt": the pages this account opens most, from this browser's visits. A shortcut whose screen the viewer can no
 * longer open (permissions change) is left out, not offered as a dead end.
 */
const openable = computed(() =>
  shortcutsOf(recent.value).filter((entry) => {
    const target = router.resolve(entry.path);
    return (
      target.name !== 'admin-unknown' &&
      canUseAdmin(session.user, {
        permission: target.meta.permission ?? null,
        capability: target.meta.capability,
      })
    );
  }),
);
</script>

<template>
  <nav
    v-if="openable.length > 0"
    aria-labelledby="admin-recent-title"
    class="flex min-w-0 flex-wrap items-center gap-2"
    data-testid="admin-recent"
  >
    <h2 id="admin-recent-title" class="mr-1 font-display text-sm font-semibold text-muted">
      {{ $t('admin.shell.recent.title') }}
    </h2>
    <RouterLink
      v-for="entry in openable"
      :key="entry.path"
      :to="entry.path"
      :title="entry.detail ?? undefined"
      class="inline-flex min-h-(--qa-control) max-w-full min-w-0 items-center gap-1.5 rounded-pill border border-line bg-surface-solid px-3 text-sm hover:bg-surface-hover"
    >
      <History aria-hidden="true" class="size-3.5 shrink-0 text-muted" :stroke-width="1.75" />
      <span class="truncate font-semibold">{{ $t(entry.titleKey) }}</span>
      <span v-if="entry.detail" class="truncate font-mono text-xs text-muted">{{
        entry.detail
      }}</span>
    </RouterLink>
  </nav>
</template>
