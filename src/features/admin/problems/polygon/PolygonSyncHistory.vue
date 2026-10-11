<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import QueryState from '@/components/QueryState.vue';
import { POLYGON_SYNCS_PAGE_SIZE } from '@/api/polygon.api';
import { ADMIN_BUTTON_CLASS } from '../../ui/classes';
import PolygonSyncRunItem from './PolygonSyncRunItem.vue';
import { usePolygonSyncsQuery } from './polygon.queries';

/** The sync history, newest first: one problem's (`code`), or every problem's (`code` null, then each row names its code). */
const props = defineProps<{ code: string | null }>();
const page = ref(1);
watch(
  () => props.code,
  () => (page.value = 1),
);
const runs = usePolygonSyncsQuery(() => props.code, page);
const items = computed(() => runs.data.value?.items ?? []);
const total = computed(() => runs.data.value?.meta.total ?? 0);
const isLastPage = computed(() => page.value * POLYGON_SYNCS_PAGE_SIZE >= total.value);
</script>

<template>
  <section class="flex flex-col gap-3" data-testid="polygon-sync-history">
    <h3 class="text-sm font-bold">{{ $t('admin.polygonLink.history.title') }}</h3>
    <QueryState :loading="runs.isPending.value" :error="runs.error.value" @retry="runs.refetch()">
      <p v-if="items.length === 0" class="text-sm text-muted">
        {{ $t('admin.polygonLink.history.empty') }}
      </p>
      <ol v-else class="flex flex-col gap-2">
        <li v-for="run in items" :key="run.id">
          <PolygonSyncRunItem :run="run" :show-code="code === null" />
        </li>
      </ol>
    </QueryState>
    <nav
      v-if="total > POLYGON_SYNCS_PAGE_SIZE"
      class="flex flex-wrap items-center justify-between gap-2 text-sm text-muted"
    >
      <span>{{ $t('admin.polygonLink.history.total', { total }) }}</span>
      <span class="flex gap-2">
        <button
          type="button"
          :class="ADMIN_BUTTON_CLASS"
          :aria-disabled="page <= 1 || undefined"
          @click="page > 1 && (page -= 1)"
        >
          {{ $t('admin.polygonLink.history.previous') }}
        </button>
        <button
          type="button"
          :class="ADMIN_BUTTON_CLASS"
          :aria-disabled="isLastPage || undefined"
          @click="!isLastPage && (page += 1)"
        >
          {{ $t('admin.polygonLink.history.next') }}
        </button>
      </span>
    </nav>
  </section>
</template>
