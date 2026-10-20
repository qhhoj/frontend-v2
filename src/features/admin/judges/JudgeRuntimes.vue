<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { JudgeRuntime } from '@/api/types/judges-admin';
import LanguageLabel from '@/components/language/LanguageLabel.vue';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import type { AdminColumn } from '../ui/table/table-columns';

defineProps<{ runtimes: JudgeRuntime[] }>();
const { t } = useI18n();
const columns = computed<AdminColumn[]>(() => [
  {
    key: 'language',
    label: t('admin.judges.runtimes.language'),
    priority: 'primary',
    mono: true,
  },
  { key: 'name', label: t('admin.judges.runtimes.compiler'), grow: true },
  { key: 'version', label: t('admin.judges.runtimes.version'), cellClass: 'font-mono' },
  { key: 'priority', label: t('admin.judges.runtimes.priority'), align: 'end' },
]);
</script>

<template>
  <section class="flex flex-col gap-2">
    <p class="text-sm text-muted">{{ $t('admin.judges.runtimes.caption') }}</p>
    <AdminDataTable
      :columns="columns"
      :rows="runtimes"
      :row-key="(runtime) => runtime.language"
      :label="$t('admin.judges.runtimes.caption')"
    >
      <template #cell-language="{ row }">
        <LanguageLabel :language="{ key: row.language, name: row.language }" />
      </template>
    </AdminDataTable>
  </section>
</template>
