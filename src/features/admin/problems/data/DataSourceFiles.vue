<script setup lang="ts">
import { computed } from 'vue';
import type { ProblemData, SourceFileKind } from '@/api/types/problem-data';
import { CARD } from '../../ui/controls';
import DataSourceRow from './DataSourceRow.vue';

const props = defineProps<{ code: string; data: ProblemData }>();

/** The checker, interactor, grader and header are uploaded beside the setting that uses them (CheckerSection). */
const SOURCES: { kind: SourceFileKind; labelKey: string }[] = [
  { kind: 'generator', labelKey: 'admin.problems.uploads.sources.generator' },
];
/** The judge refuses test generators, so a slot is offered only for a file already stored: it can be deleted, not replaced. */
const stored = computed(() => SOURCES.filter((source) => props.data[source.kind]));
</script>

<template>
  <section v-if="stored.length > 0" :class="CARD" aria-labelledby="data-sources-title">
    <h2 id="data-sources-title" class="px-4 pt-4 font-display text-base font-semibold sm:px-5">
      {{ $t('admin.problems.uploads.sources.title') }}
    </h2>
    <ul class="divide-y divide-line">
      <DataSourceRow
        v-for="source in stored"
        :key="source.kind"
        :code="code"
        :kind="source.kind"
        :label="$t(source.labelKey)"
        :stored-name="data[source.kind]"
      />
    </ul>
  </section>
</template>
