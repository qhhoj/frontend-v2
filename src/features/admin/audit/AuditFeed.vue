<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AdminBit from '../shell/AdminBit.vue';
import { BUTTON } from '../ui/controls';
import AuditEntryRow from './AuditEntryRow.vue';
import AuditFilters from './AuditFilters.vue';
import { auditFilterFromQuery, auditFilterQuery, toAuditRequest } from './audit';
import type { AuditFilter } from './audit';
import { useAuditFeedQuery } from './audit.queries';

/** The global change log: filters in the URL, newest first, older pages appended below. */
const route = useRoute();
const router = useRouter();
const filter = computed(() => auditFilterFromQuery(route.query));
const feed = useAuditFeedQuery(() => toAuditRequest(filter.value));
const entries = computed(() => feed.data.value?.pages.flatMap((page) => page.items) ?? []);

function showFilter(next: AuditFilter) {
  void router.replace({ query: auditFilterQuery(next) });
}
</script>

<template>
  <div class="flex flex-col gap-4" data-testid="audit-feed">
    <AuditFilters :filter="filter" @change="showFilter" />
    <!-- Once entries show, a failed older page or refresh keeps them and says so below. -->
    <QueryState
      :loading="feed.isPending.value"
      :error="entries.length > 0 ? null : feed.error.value"
      @retry="feed.refetch()"
    >
      <template #skeleton><SkeletonBlock class="h-96 w-full" /></template>
      <ol
        v-if="entries.length > 0"
        class="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface-solid"
        :aria-label="$t('admin.audit.listLabel')"
      >
        <AuditEntryRow v-for="entry in entries" :key="entry.id" :entry="entry" />
      </ol>
      <p v-else class="rounded-card border border-line px-4 py-8 text-center text-muted">
        <AdminBit placement="empty" />
        {{ $t('admin.audit.empty') }}
      </p>
      <p
        v-if="entries.length > 0 && feed.error.value"
        role="alert"
        class="text-center text-sm text-negative"
      >
        {{ $t('admin.audit.loadFailed') }}
      </p>
      <div v-if="feed.hasNextPage.value" class="flex justify-center">
        <button
          type="button"
          :class="BUTTON.secondary"
          :disabled="feed.isFetchingNextPage.value"
          @click="feed.fetchNextPage()"
        >
          {{ $t('admin.audit.older') }}
        </button>
      </div>
    </QueryState>
  </div>
</template>
