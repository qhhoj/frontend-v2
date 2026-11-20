<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import { History } from 'lucide-vue-next';
import { computed } from 'vue';
import { recordOf } from './continue-records';
import { shortcutsOf, useRecentScreens } from './recent-screens';
import { useIsOpenable } from './use-openable';

const { recent } = useRecentScreens();
const isOpenable = useIsOpenable();
/**
 * "Lối tắt": the pages this account opens most, from this browser's visits, without the problems and contests (those are
 * the rows of "Tiếp tục"). A shortcut whose screen the viewer can no longer open is left out.
 */
const openable = computed(() =>
  shortcutsOf(recent.value.filter((entry) => !recordOf(entry.path))).filter((entry) =>
    isOpenable(entry.path),
  ),
);
</script>

<template>
  <nav
    v-if="openable.length > 0"
    aria-labelledby="admin-recent-title"
    class="flex min-w-0 flex-wrap items-center gap-2"
    data-testid="admin-recent"
  >
    <h2 id="admin-recent-title" class="mr-1 text-sm font-semibold">
      {{ $t('admin.shell.recent.title') }}
    </h2>
    <AppButton
      v-for="entry in openable"
      :key="entry.path"
      size="sm"
      :to="entry.path"
      :title="entry.detail ?? undefined"
      class="max-w-full min-w-0"
    >
      <template #icon><History aria-hidden="true" class="text-muted" /></template>
      <span class="truncate">{{ $t(entry.titleKey) }}</span>
      <span v-if="entry.detail" class="truncate font-mono text-small font-normal text-muted">{{
        entry.detail
      }}</span>
    </AppButton>
  </nav>
</template>
