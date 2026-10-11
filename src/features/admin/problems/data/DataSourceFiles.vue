<script setup lang="ts">
import type { ProblemData, SourceFileKind } from '@/api/types/problem-data';
import { CARD } from '../../ui/controls';
import DataSourceRow from './DataSourceRow.vue';

defineProps<{ code: string; data: ProblemData }>();

const SOURCES: { kind: SourceFileKind; labelKey: string }[] = [
  { kind: 'generator', labelKey: 'admin.problems.uploads.sources.generator' },
  { kind: 'customChecker', labelKey: 'admin.problems.uploads.sources.customChecker' },
  { kind: 'customGrader', labelKey: 'admin.problems.uploads.sources.customGrader' },
  { kind: 'customHeader', labelKey: 'admin.problems.uploads.sources.customHeader' },
];
</script>

<template>
  <section :class="CARD" aria-labelledby="data-sources-title">
    <h2 id="data-sources-title" class="px-4 pt-4 font-display text-base font-semibold sm:px-5">
      {{ $t('admin.problems.uploads.sources.title') }}
    </h2>
    <ul class="divide-y divide-line">
      <DataSourceRow
        v-for="source in SOURCES"
        :key="source.kind"
        :code="code"
        :kind="source.kind"
        :label="$t(source.labelKey)"
        :stored-name="data[source.kind]"
      />
    </ul>
  </section>
</template>
