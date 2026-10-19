<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import type { FlatpageRevision } from '@/api/types/flatpages-admin';
import { FLATPAGE_REVISIONS_PAGE_SIZE } from '@/api/flatpages-admin.api';
import AdminBit from '../shell/AdminBit.vue';
import { BUTTON } from '../ui/controls';
import { positivePageOf } from './flatpage-route';
import { useFlatpageRevisionsQuery } from './flatpage-revisions.queries';
import FlatpageRevisionRow from './FlatpageRevisionRow.vue';

const props = defineProps<{ pageId: string; readonly?: boolean }>();
const emit = defineEmits<{ load: [revision: FlatpageRevision] }>();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const page = computed(() => positivePageOf(route.query.hp));
const query = useFlatpageRevisionsQuery(() => props.pageId, page);
const items = computed(() => query.data.value?.items ?? []);
const total = computed(() => query.data.value?.meta.total ?? 0);
const hasNext = computed(() => page.value * FLATPAGE_REVISIONS_PAGE_SIZE < total.value);
/** The newest change of the first page is open at once; the other rows open on demand. */
const openIds = ref<Set<string>>(new Set());
watch(items, (list) => (openIds.value = new Set(page.value === 1 && list[0] ? [list[0].id] : [])), {
  immediate: true,
});

function toggle(revisionId: string) {
  const next = new Set(openIds.value);
  if (next.has(revisionId)) next.delete(revisionId);
  else next.add(revisionId);
  openIds.value = next;
}

function goToPage(target: number) {
  void router.push({ query: { ...route.query, hp: target === 1 ? undefined : String(target) } });
}
</script>

<template>
  <section class="flex min-w-0 flex-col gap-4" :aria-label="$t('admin.pages.history.title')">
    <QueryState
      :loading="query.isPending.value"
      :error="query.error.value"
      @retry="query.refetch()"
    >
      <p v-if="items.length === 0" class="flex items-center gap-3 text-muted">
        <AdminBit placement="empty" />{{ t('admin.pages.history.empty') }}
      </p>
      <div v-else class="relative overflow-x-auto rounded-card border border-line bg-surface-solid">
        <table class="w-full min-w-[640px] text-sm">
          <thead class="text-left text-xs text-muted">
            <tr>
              <th class="px-3 py-2 font-semibold">{{ t('admin.pages.history.columns.time') }}</th>
              <th class="px-3 py-2 font-semibold">{{ t('admin.pages.history.columns.action') }}</th>
              <th class="px-3 py-2 font-semibold">{{ t('admin.pages.history.columns.editor') }}</th>
              <th class="px-3 py-2 font-semibold">{{ t('admin.pages.history.columns.fields') }}</th>
              <th class="px-3 py-2">
                <span class="sr-only">{{ t('admin.pages.history.columns.actions') }}</span>
              </th>
            </tr>
          </thead>
          <FlatpageRevisionRow
            v-for="revision in items"
            :key="revision.id"
            :revision="revision"
            :is-open="openIds.has(revision.id)"
            :readonly="readonly"
            @toggle="toggle(revision.id)"
            @load="emit('load', revision)"
          />
        </table>
      </div>
      <footer class="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span class="text-muted">{{ t('admin.pages.history.total', { total }) }}</span>
        <div class="flex gap-2">
          <button
            type="button"
            :class="BUTTON.secondary"
            :aria-disabled="page <= 1 || undefined"
            @click="page > 1 && goToPage(page - 1)"
          >
            {{ t('admin.pages.history.previous') }}
          </button>
          <button
            type="button"
            :class="BUTTON.secondary"
            :aria-disabled="!hasNext || undefined"
            @click="hasNext && goToPage(page + 1)"
          >
            {{ t('admin.pages.history.next') }}
          </button>
        </div>
      </footer>
      <p v-if="!readonly" class="text-xs text-muted">{{ t('admin.pages.history.note') }}</p>
    </QueryState>
  </section>
</template>
