<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { BulkVisibilityResult } from '@/api/types/problems';
import AdminStatus from '../ui/AdminStatus.vue';

/** The last bulk run: counts, then every refused code with why. */
const props = defineProps<{ result: BulkVisibilityResult }>();
const i18n = useI18n();
const failures = computed(() => props.result.results.filter((item) => item.outcome === 'failed'));
const unchanged = computed(
  () => props.result.results.filter((item) => item.outcome === 'unchanged').length,
);
const summary = computed(() =>
  i18n.t('admin.problemList.bulk.summary', {
    done: props.result.done,
    unchanged: unchanged.value,
    failed: props.result.failed,
  }),
);
const reasonText = (reason: string | undefined) => {
  const key = `admin.problemList.bulk.reasons.${reason ?? 'unknown'}`;
  return i18n.te(key) ? i18n.t(key) : (reason ?? '');
};
</script>

<template>
  <div class="flex flex-col gap-2">
    <AdminStatus :kind="result.failed > 0 ? 'refused' : 'done'" :text="summary" />
    <ul v-if="failures.length > 0" class="flex flex-col gap-1 text-sm">
      <li v-for="failure in failures" :key="failure.code" class="flex flex-wrap gap-2">
        <span class="font-mono font-semibold">{{ failure.code }}</span>
        <span class="text-muted">{{ reasonText(failure.reason) }}</span>
      </li>
    </ul>
  </div>
</template>
