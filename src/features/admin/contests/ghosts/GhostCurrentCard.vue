<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { deleteGhosts, ghostsCsvUrl } from '@/api/contest-ghosts.api';
import type { Ghost } from '@/api/types/contest-ghosts';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import EmptyState from '@/components/EmptyState.vue';
import { useViewerId } from '@/stores/use-viewer-id';
import { ADMIN_BIT_KINDS } from '../../shell/admin-bit';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { ADMIN_BUTTON_CLASS, ADMIN_DANGER_CLASS } from '../../ui/classes';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import GhostPreviewTable from './GhostPreviewTable.vue';
import { ghostsKey } from './ghosts.queries';

/** The stored set: rows, the CSV download, and delete after a confirm that offers the download again. */
const props = defineProps<{ contestKey: string; ghosts: Ghost[] }>();
const viewerId = useViewerId();
const isDeleteOpen = ref(false);
const isDeleted = ref(false);
const csvUrl = computed(() => ghostsCsvUrl(props.contestKey));
/** "Deleted" describes the empty set only: a newly stored set clears it. */
watch(
  () => props.ghosts.length,
  (count) => {
    if (count > 0) isDeleted.value = false;
  },
);
const removing = useAdminMutation({
  mutate: () => deleteGhosts(props.contestKey),
  invalidates: () => [ghostsKey(viewerId.value, props.contestKey), ['contests', 'replay']],
  onDone: () => {
    isDeleteOpen.value = false;
    isDeleted.value = true;
  },
});
</script>

<template>
  <section data-testid="ghost-current" class="glass flex min-w-0 flex-col gap-4 rounded-panel p-5">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="font-display text-base font-bold">{{ $t('admin.ghosts.current.title') }}</h2>
      <span v-if="ghosts.length" class="text-sm text-muted">
        {{ $t('admin.ghosts.current.count', { count: ghosts.length }) }}
      </span>
    </header>
    <AdminStatus v-if="isDeleted" kind="done" :text="$t('admin.ghosts.current.deleted')" />
    <EmptyState v-if="!ghosts.length" compact :kind="ADMIN_BIT_KINDS.empty">
      {{ $t('admin.ghosts.current.empty') }}
    </EmptyState>
    <template v-else>
      <GhostPreviewTable :ghosts="ghosts" :label="$t('admin.ghosts.current.title')" />
      <div class="flex flex-wrap gap-3">
        <a :href="csvUrl" download :class="ADMIN_BUTTON_CLASS">
          {{ $t('admin.ghosts.current.download') }}
        </a>
        <button type="button" :class="ADMIN_DANGER_CLASS" @click="isDeleteOpen = true">
          {{ $t('admin.ghosts.current.delete') }}
        </button>
      </div>
    </template>
    <ConfirmDialog
      v-model:visible="isDeleteOpen"
      :title="$t('admin.ghosts.current.deleteTitle', { count: ghosts.length })"
      :body="$t('admin.ghosts.current.deleteBody')"
      :confirm-label="$t('admin.ghosts.current.deleteConfirm')"
      tone="danger"
      :busy="removing.isPending.value"
      @confirm="removing.run(undefined)"
    >
      <template #error>
        <p v-if="removing.failure.value" role="alert" class="text-sm text-negative">
          {{ failureTextOf(removing.failure.value) }}
        </p>
      </template>
    </ConfirmDialog>
  </section>
</template>
