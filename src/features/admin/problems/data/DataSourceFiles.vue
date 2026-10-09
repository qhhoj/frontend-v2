<script setup lang="ts">
import type { ProblemData, SourceFileKind } from '@/api/types/problem-data';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
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
  <SettingsCard :title="$t('admin.problems.uploads.sources.title')">
    <DataSourceRow
      v-for="source in SOURCES"
      :key="source.kind"
      :code="code"
      :kind="source.kind"
      :label="$t(source.labelKey)"
      :stored-name="data[source.kind]"
    />
  </SettingsCard>
</template>
