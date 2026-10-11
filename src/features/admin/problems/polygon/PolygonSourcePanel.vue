<script setup lang="ts">
import type { PolygonProblem } from '@/api/types/polygon';
import { formatNumericDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import PackageStatePill from './PackageStatePill.vue';
import PackageTypePill from './PackageTypePill.vue';

/** Step 2's side card: the picked Polygon problem, what each sync takes from the package and what QHHOJ keeps. */
defineProps<{ problem: PolygonProblem }>();
const FROM_PACKAGE = ['statements', 'tests', 'checker', 'limits'] as const;
const locale = useLocaleStore();
</script>

<template>
  <aside
    class="flex flex-col gap-4 rounded-card border border-line bg-surface-strong p-5 lg:sticky lg:top-4"
  >
    <div>
      <p class="text-xs font-bold tracking-wide text-muted uppercase">
        {{ $t('admin.polygonLink.source.label') }}
      </p>
      <h2 class="font-display text-lg font-bold break-words">
        {{ problem.title ?? problem.name }}
      </h2>
    </div>
    <dl class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
      <dt class="text-muted">Polygon</dt>
      <dd class="font-mono break-all">{{ problem.name }} · {{ problem.id }}</dd>
      <dt class="text-muted">{{ $t('admin.polygonLink.source.owner') }}</dt>
      <dd>{{ problem.owner }}</dd>
      <dt class="text-muted">{{ $t('admin.polygonLink.source.package') }}</dt>
      <dd class="flex flex-wrap items-center gap-2">
        <span class="font-mono">{{
          $t('admin.polygonLink.source.packageValue', {
            revision: problem.latestPackage.revision ?? problem.revision,
            id: problem.latestPackage.id ?? '-',
          })
        }}</span>
        <PackageStatePill :state="problem.latestPackage.state" />
        <PackageTypePill :type="problem.latestPackage.type" />
      </dd>
      <template v-if="problem.latestPackage.createdAt">
        <dt class="text-muted">{{ $t('admin.polygonLink.source.built') }}</dt>
        <dd>
          <time :datetime="problem.latestPackage.createdAt">{{
            formatNumericDateTime(problem.latestPackage.createdAt, locale.locale)
          }}</time>
        </dd>
      </template>
    </dl>
    <div class="flex flex-col gap-2 border-t border-line pt-4">
      <h3 class="text-xs font-bold tracking-wide text-muted uppercase">
        {{ $t('admin.polygonLink.source.fromPolygon') }}
      </h3>
      <ul class="flex list-disc flex-col gap-1 pl-5 text-sm">
        <li v-for="item in FROM_PACKAGE" :key="item">
          {{ $t(`admin.polygonLink.source.taken.${item}`) }}
        </li>
      </ul>
    </div>
    <div class="flex flex-col gap-2 border-t border-line pt-4">
      <h3 class="text-xs font-bold tracking-wide text-muted uppercase">
        {{ $t('admin.polygonLink.source.keptByQhhoj') }}
      </h3>
      <p class="text-sm">{{ $t('admin.polygonLink.source.kept') }}</p>
    </div>
  </aside>
</template>
