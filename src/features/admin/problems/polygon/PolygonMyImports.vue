<script setup lang="ts">
import { CircleCheck, CircleX, Clock, LoaderCircle, TriangleAlert } from 'lucide-vue-next';
import type { Component } from 'vue';
import { computed } from 'vue';
import { formatAgoCompact } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import Card from '@/components/ui/Card.vue';
import Chip from '@/components/ui/Chip.vue';
import type { ChipTone } from '@/components/ui/Chip.vue';
import { useMyImportsQuery } from './polygon.queries';
import { myImportStatusOf } from './polygon-my-imports';
import type { MyImportStatus } from './polygon-my-imports';

/** "Lượt nhập của tôi": the viewer's imports of the last day, each reopening its progress step; hidden while there are none. */
const imports = useMyImportsQuery();
const locale = useLocaleStore();
const now = useNow(30_000);
const rows = computed(() =>
  (imports.data.value ?? []).map((job) => ({ job, status: myImportStatusOf(job) })),
);

const LOOKS: Record<MyImportStatus, { tone: ChipTone; icon: Component }> = {
  queued: { tone: 'neutral', icon: Clock },
  running: { tone: 'accent', icon: LoaderCircle },
  done: { tone: 'success', icon: CircleCheck },
  failed: { tone: 'danger', icon: CircleX },
  attention: { tone: 'warning', icon: TriangleAlert },
};
</script>

<template>
  <Card
    v-if="rows.length > 0"
    variant="flat"
    class="flex flex-col gap-2 p-4 md:p-5"
    data-testid="polygon-my-imports"
    aria-labelledby="polygon-my-imports-title"
  >
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h2 id="polygon-my-imports-title" class="font-display text-title font-semibold">
        {{ $t('admin.polygonLink.myImports.title') }}
      </h2>
      <span class="text-meta text-muted">{{ $t('admin.polygonLink.myImports.window') }}</span>
    </div>
    <ul class="flex flex-col">
      <li
        v-for="{ job, status } in rows"
        :key="job.id"
        class="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 border-t border-line py-2 first:border-t-0"
      >
        <span class="min-w-0 flex-1 basis-32 font-mono text-sm break-all">
          {{ job.code }}
          <span v-if="job.purpose === 'sync'" class="font-sans text-meta text-muted">
            · {{ $t('admin.polygonLink.myImports.sync') }}</span
          >
        </span>
        <Chip :tone="LOOKS[status].tone" :icon="LOOKS[status].icon">{{
          $t(`admin.polygonLink.myImports.status.${status}`)
        }}</Chip>
        <time
          :datetime="job.createdAt"
          class="font-mono text-meta whitespace-nowrap text-muted tabular-nums"
          >{{ formatAgoCompact(job.createdAt, now, locale.locale) }}</time
        >
        <RouterLink
          :to="{ name: 'admin-polygonImport', query: { job: job.id } }"
          class="inline-flex min-h-6 items-center text-sm font-semibold text-accent-text underline underline-offset-2 pointer-coarse:min-h-11"
          :aria-label="$t('admin.polygonLink.myImports.viewLabel', { code: job.code })"
          >{{ $t('admin.polygonLink.myImports.view') }}</RouterLink
        >
      </li>
    </ul>
  </Card>
</template>
