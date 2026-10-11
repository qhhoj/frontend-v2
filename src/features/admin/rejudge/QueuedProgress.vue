<script setup lang="ts">
import { computed } from 'vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import {
  QUEUE_POLL_MS,
  useAdminSubmissionListQuery,
} from '../submissions/admin-submissions.queries';

/** How many submissions of the batch's scope still wait for a judge, polled, with a link to watch them in the admin list. */
const props = defineProps<{ query: Record<string, string> }>();
const locale = useLocaleStore();
const { data } = useAdminSubmissionListQuery(
  () => ({ ...props.query, status: ['QU'], page: 1, pageSize: 1 }),
  { pollMs: QUEUE_POLL_MS },
);
const waiting = computed(() => data.value?.meta.total ?? null);
</script>

<template>
  <p class="flex flex-wrap items-center gap-3 text-sm" aria-live="polite">
    <span v-if="waiting !== null">
      {{ $t('admin.rejudge.progress.waiting', { count: formatNumber(waiting, locale.locale) }) }}
    </span>
    <RouterLink
      :to="{ name: 'admin-submissions', query }"
      class="font-semibold text-accent-text underline"
    >
      {{ $t('admin.rejudge.progress.open') }}
    </RouterLink>
  </p>
</template>
