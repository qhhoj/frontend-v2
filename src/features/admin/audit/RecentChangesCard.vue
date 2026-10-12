<script setup lang="ts">
import { computed } from 'vue';
import { useSessionStore } from '@/stores/session.store';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import Card from '@/components/ui/Card.vue';
import { canUseAdmin } from '../admin-access';
import { ADMIN_SCREENS, adminRouteName } from '../admin-screens';
import AuditEntryRow from './AuditEntryRow.vue';
import { useRecentChangesQuery } from './audit.queries';

/** The dashboard's activity feed: the newest recorded changes, for viewers who may open the change log. */
const RECENT_LIMIT = 6;
const session = useSessionStore();
const canSeeLog = computed(() => canUseAdmin(session.user, ADMIN_SCREENS.log));
const recent = useRecentChangesQuery(RECENT_LIMIT, canSeeLog);
const entries = computed(() => recent.data.value?.items ?? []);
</script>

<template>
  <section
    v-if="canSeeLog"
    aria-labelledby="admin-recent-changes-title"
    class="flex flex-col gap-3"
    data-testid="admin-recent-changes"
  >
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h2 id="admin-recent-changes-title" class="font-display text-base font-bold">
        {{ $t('admin.audit.recent.title') }}
      </h2>
      <RouterLink
        :to="{ name: adminRouteName('log') }"
        class="inline-flex min-h-11 items-center text-sm font-semibold text-accent hover:underline"
      >
        {{ $t('admin.audit.recent.all') }}
      </RouterLink>
    </div>
    <QueryState
      :loading="recent.isPending.value"
      :error="recent.error.value"
      @retry="recent.refetch()"
    >
      <template #skeleton><SkeletonBlock class="h-64 w-full" /></template>
      <Card
        v-if="entries.length > 0"
        as="ol"
        variant="flat"
        class="divide-y divide-line overflow-hidden"
      >
        <AuditEntryRow v-for="entry in entries" :key="entry.id" :entry="entry" />
      </Card>
      <Card v-else as="p" variant="flat" class="px-4 py-6 text-center text-sm text-muted">
        {{ $t('admin.audit.recent.empty') }}
      </Card>
    </QueryState>
  </section>
</template>
