<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminStatus from '../ui/AdminStatus.vue';

/** One bulk run's outcome: the counts, then every refused row with why (`reasons.<code>` in `reasonPrefix`, else the raw code). */
const props = defineProps<{
  results: { name: string; outcome: string; reason?: string }[];
  reasonPrefix: string;
}>();
const i18n = useI18n();
const count = (outcome: string) => props.results.filter((item) => item.outcome === outcome).length;
const failures = computed(() => props.results.filter((item) => item.outcome === 'failed'));
const summary = computed(() =>
  i18n.t('admin.contests.bulk.summary', {
    done: count('done'),
    unchanged: count('unchanged'),
    failed: count('failed'),
  }),
);
const reasonText = (reason: string | undefined) => {
  const key = `${props.reasonPrefix}.${reason ?? 'unknown'}`;
  return i18n.te(key) ? i18n.t(key) : (reason ?? '');
};
</script>

<template>
  <div class="flex flex-col gap-2">
    <AdminStatus :kind="failures.length > 0 ? 'refused' : 'done'" :text="summary" />
    <ul v-if="failures.length > 0" class="flex flex-col gap-1 text-sm">
      <li v-for="(failure, index) in failures" :key="index" class="flex flex-wrap gap-2">
        <span class="font-mono font-semibold">{{ failure.name }}</span>
        <span class="text-muted">{{ reasonText(failure.reason) }}</span>
      </li>
    </ul>
  </div>
</template>
