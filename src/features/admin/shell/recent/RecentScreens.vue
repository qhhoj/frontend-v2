<script setup lang="ts">
import { ChevronRight, History } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session.store';
import { canUseAdmin } from '../../admin-access';
import { CARD } from '../../ui/controls';
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
  <section
    v-if="openable.length > 0"
    aria-labelledby="admin-recent-title"
    class="flex min-w-0 flex-col gap-3"
    data-testid="admin-recent"
  >
    <h2 id="admin-recent-title" class="font-display text-base font-semibold">
      {{ $t('admin.shell.recent.title') }}
    </h2>
    <ul :class="[CARD, 'm-0 flex list-none flex-col divide-y divide-line overflow-hidden p-0']">
      <li v-for="entry in openable" :key="entry.path">
        <RouterLink
          :to="entry.path"
          class="flex min-h-[var(--qa-row,2.5rem)] min-w-0 items-center gap-3 px-4 py-2 text-sm hover:bg-surface-hover"
        >
          <History aria-hidden="true" class="size-4 shrink-0 text-muted" :stroke-width="1.75" />
          <span class="min-w-0 flex-1">
            <span class="block truncate font-semibold">{{ $t(entry.titleKey) }}</span>
            <span v-if="entry.detail" class="block truncate font-mono text-xs text-muted">{{
              entry.detail
            }}</span>
          </span>
          <ChevronRight
            aria-hidden="true"
            class="size-4 shrink-0 text-muted"
            :stroke-width="1.75"
          />
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
