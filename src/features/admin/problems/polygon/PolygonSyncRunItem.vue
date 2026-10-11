<script setup lang="ts">
import { computed } from 'vue';
import type { PolygonSyncRun } from '@/api/types/polygon';
import { formatNumericDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminUserLabel from '../../ui/AdminUserLabel.vue';

/** One finished import or sync: result, when, which package, how it started and by whom, and where a failure stopped. */
const props = defineProps<{ run: PolygonSyncRun; showCode: boolean }>();
const locale = useLocaleStore();
const dateText = (date: string) => formatNumericDateTime(date, locale.locale);
const isFailed = computed(() => props.run.result === 'failed');
</script>

<template>
  <article
    :data-run-result="run.result"
    class="flex flex-col gap-1.5 rounded-row border border-line bg-surface-solid p-3 text-sm"
  >
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span
        class="rounded-pill px-2 py-0.5 text-xs font-bold"
        :class="isFailed ? 'bg-verdict-wa-bg text-verdict-wa' : 'bg-verdict-ac-bg text-verdict-ac'"
        >{{ $t(`admin.polygonLink.history.results.${run.result}`) }}</span
      >
      <time :datetime="run.finishedAt" class="font-semibold">{{ dateText(run.finishedAt) }}</time>
      <RouterLink
        v-if="showCode"
        :to="{ name: 'admin-problemGeneral', params: { code: run.code } }"
        class="font-mono font-semibold text-accent-text underline-offset-2 hover:underline"
        >{{ run.code }}</RouterLink
      >
      <span class="font-mono text-muted">
        {{
          $t('admin.polygonLink.source.packageValue', { revision: run.revision, id: run.packageId })
        }}
      </span>
      <span v-if="run.packageCreatedAt" class="text-muted">
        {{ $t('admin.polygonLink.history.builtAt', { date: dateText(run.packageCreatedAt) }) }}
      </span>
    </div>
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted">
      <span>{{ $t(`admin.polygonLink.history.purposes.${run.purpose}`) }}</span>
      <span>·</span>
      <span>{{ $t(`admin.polygonLink.history.triggers.${run.trigger}`) }}</span>
      <template v-if="run.requestedBy">
        <span>·</span>
        <AdminUserLabel
          :username="run.requestedBy.username"
          :rating="run.requestedBy.rating"
          :link="false"
        />
      </template>
    </div>
    <p v-if="isFailed" class="text-negative">
      <template v-if="run.failedStep">
        {{
          $t('admin.polygon.progress.stoppedAt', {
            step: $t(`admin.polygon.progress.failedSteps.${run.failedStep}`),
          })
        }}
      </template>
      {{ run.error }}
    </p>
  </article>
</template>
