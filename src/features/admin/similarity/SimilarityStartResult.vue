<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { RouteLocationRaw } from 'vue-router';
import type { ApiError } from '@/api/client';
import { failureTextOf } from '../ui/admin-errors';
import AdminStatus from '../ui/AdminStatus.vue';
import { waitParts } from './similarity-runs';

/** The outcome of the last start: queued, a refusal, or nothing yet. */
const props = defineProps<{
  isDone: boolean;
  failure: ApiError | null;
  /** The run that blocks a new one (409): a link to it, null when the list has not named it. */
  runningTo: RouteLocationRaw | null;
}>();

const { t } = useI18n();
const isConflict = computed(() => props.failure?.status === 409);
const isRateLimited = computed(() => props.failure?.status === 429);

/** The wait the server named in `Retry-After`; without the header no countdown is invented. */
const rateLimitText = computed(() => {
  const seconds = props.failure?.retryAfterSeconds ?? null;
  if (seconds === null)
    return `${t('admin.similarity.start.rateLimited')} ${t('admin.similarity.start.retryWithoutHeader')}`;
  const { unit, count } = waitParts(seconds);
  const wait = t('admin.similarity.start.retryAfter', {
    count,
    unit: t(`admin.similarity.units.${unit}`),
  });
  return `${t('admin.similarity.start.rateLimited')} ${wait}`;
});
</script>

<template>
  <AdminStatus v-if="isDone" kind="queued" :text="$t('admin.similarity.start.queued')" />
  <AdminStatus v-else-if="isConflict" kind="refused" :text="$t('admin.similarity.start.conflict')">
    <RouterLink v-if="runningTo" :to="runningTo" class="min-h-11 font-semibold underline">
      {{ $t('admin.similarity.start.openRunning') }}
    </RouterLink>
  </AdminStatus>
  <AdminStatus v-else-if="isRateLimited" kind="refused" :text="rateLimitText" />
  <AdminStatus v-else-if="failure" kind="refused" :text="failureTextOf(failure)" />
</template>
