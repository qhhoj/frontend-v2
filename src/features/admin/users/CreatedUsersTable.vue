<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CreatedUser } from '@/api/types/users-admin';
import { adminIssueText } from '../ui/admin-errors';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import type { AdminColumn } from '../ui/table/table-columns';

const props = defineProps<{ results: CreatedUser[] }>();
const { t } = useI18n();
/** The results have no id: a failed row may repeat a username, so the row's place is its key. */
const rows = computed(() => props.results.map((result, index) => ({ ...result, index })));
const columns = computed<AdminColumn[]>(() => [
  {
    key: 'username',
    label: t('admin.users.create.results.username'),
    priority: 'primary',
    mono: true,
  },
  { key: 'status', label: t('admin.users.create.results.status'), priority: 'badge' },
  { key: 'detail', label: t('admin.users.create.results.detail'), grow: true },
]);
</script>

<template>
  <AdminDataTable
    :columns="columns"
    :rows="rows"
    :row-key="(row) => String(row.index)"
    :row-label="(row) => row.username"
    :label="$t('admin.users.create.results.caption')"
  >
    <template #cell-status="{ row }">
      <span :class="row.status === 'created' ? 'text-verdict-ac' : 'text-negative'">
        {{ $t(`admin.users.create.results.${row.status}`) }}
      </span>
    </template>
    <template #cell-detail="{ row }">
      <code v-if="row.generatedPassword" class="font-mono">{{ row.generatedPassword }}</code>
      <span v-else-if="row.invited">{{ $t('admin.users.create.results.invited') }}</span>
      <span v-else-if="row.issues.length">{{ row.issues.map(adminIssueText).join(' ') }}</span>
    </template>
  </AdminDataTable>
</template>
