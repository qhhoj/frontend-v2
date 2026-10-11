<script setup lang="ts">
import { History } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { usePermissions } from '@/stores/use-permissions';
import { useRecentScreens } from './recent-screens';

const router = useRouter();
const { canAny } = usePermissions();
const { recent } = useRecentScreens();
/** A shortcut whose screen the viewer can no longer open (permissions change) is left out, not offered as a dead end. */
const openable = computed(() =>
  recent.value.filter((entry) => {
    const target = router.resolve(entry.path);
    return target.name !== 'admin-unknown' && canAny(target.meta.permission ?? null);
  }),
);
</script>

<template>
  <section
    v-if="openable.length > 0"
    aria-labelledby="admin-recent-title"
    class="flex flex-col gap-3"
    data-testid="admin-recent"
  >
    <h2 id="admin-recent-title" class="font-display text-base font-bold">
      {{ $t('admin.shell.recent.title') }}
    </h2>
    <ul class="flex flex-wrap gap-2">
      <li v-for="entry in openable" :key="entry.path">
        <RouterLink
          :to="entry.path"
          class="flex min-h-11 items-center gap-2 rounded-pill border border-line bg-surface-solid px-4 text-sm hover:bg-surface-hover"
        >
          <History aria-hidden="true" class="size-4 text-muted" />
          <span class="font-semibold">{{ $t(entry.titleKey) }}</span>
          <span v-if="entry.detail" class="font-mono text-xs text-muted">{{ entry.detail }}</span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
