<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { NumberedPageMeta } from '@/api/client';
import type { IntegrationClient, IntegrationScope } from '@/api/types/integration-clients';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import AdminChip from '../ui/AdminChip.vue';
import type { ChipTone } from '../ui/AdminChip.vue';
import { buttonClass } from '../ui/controls';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import type { AdminColumn } from '../ui/table/table-columns';
import { SCOPE_KEYS } from './integration-form';

/** The card takes focus after a revoke (`tabindex=-1`, id `integration-table`). On a phone each client is a card. */
defineProps<{
  clients: IntegrationClient[];
  meta?: NumberedPageMeta;
  isLocked: boolean;
  loading: boolean;
  error: unknown;
}>();
defineEmits<{ revoke: [client: IntegrationClient]; retry: [] }>();
defineSlots<{ empty?: () => unknown }>();
const locale = useLocaleStore();
const { t } = useI18n();

const columns = computed<AdminColumn[]>(() => [
  {
    key: 'name',
    label: t('admin.integrations.table.name'),
    priority: 'primary',
    cellClass: 'min-w-48',
  },
  { key: 'state', label: t('admin.integrations.table.state'), priority: 'badge' },
  { key: 'scopes', label: t('admin.integrations.table.scopes'), priority: 'meta' },
  { key: 'lastUsed', label: t('admin.integrations.table.lastUsed'), priority: 'meta' },
  { key: 'cidrs', label: t('admin.integrations.table.cidrs'), priority: 'meta' },
]);
const dateOf = (value: string) => formatDate(value, 'datetime', locale.locale);
type ClientState = 'revoked' | 'expired' | 'active';
/** Revoked wins over expired: both end the key, but revoking is the staff's act. */
const stateOf = (client: IntegrationClient): ClientState => {
  if (client.revokedAt) return 'revoked';
  return client.expiresAt && new Date(client.expiresAt).getTime() <= Date.now()
    ? 'expired'
    : 'active';
};
const STATE_TONES: Record<ClientState, ChipTone> = {
  active: 'positive',
  expired: 'caution',
  revoked: 'neutral',
};
const stateText = (client: IntegrationClient) => {
  const state = stateOf(client);
  if (state === 'revoked')
    return t('admin.integrations.table.revokedAt', { date: dateOf(client.revokedAt!) });
  if (state === 'expired')
    return t('admin.integrations.table.expiredAt', { date: dateOf(client.expiresAt!) });
  return t('admin.integrations.table.active');
};
const scopeText = (scope: IntegrationScope) =>
  t(`admin.integrations.form.scope.${SCOPE_KEYS[scope]}`);
</script>

<template>
  <AdminDataTable
    id="integration-table"
    :pager="meta ? { meta, label: $t('admin.integrations.table.pager') } : undefined"
    data-testid="integration-table"
    tabindex="-1"
    class="focus-visible:-outline-offset-2"
    :columns="columns"
    :rows="clients"
    :row-key="(client) => client.id"
    :row-label="(client) => client.name"
    :row-attrs="(client) => ({ 'data-client': client.id })"
    :label="$t('admin.integrations.table.caption')"
    :loading="loading"
    :error="error"
    :skeleton-rows="3"
    @retry="$emit('retry')"
  >
    <template #cell-name="{ row }">
      <span class="block font-semibold">{{ row.name }}</span>
      <span class="block font-mono text-xs text-muted">{{ row.keyPrefix }}…</span>
      <span class="block text-xs text-muted">{{
        $t('admin.integrations.table.actsAsUser', { username: row.actsAs.username })
      }}</span>
    </template>
    <template #cell-state="{ row }">
      <AdminChip :tone="STATE_TONES[stateOf(row)]">{{ stateText(row) }}</AdminChip>
    </template>
    <template #cell-scopes="{ row }">
      <span class="inline-flex flex-wrap gap-1">
        <AdminChip v-for="scope in row.scopes" :key="scope" :title="scope">
          {{ scopeText(scope) }}
        </AdminChip>
      </span>
    </template>
    <template #cell-lastUsed="{ row }">
      <span class="block text-muted">{{
        row.lastUsedAt ? dateOf(row.lastUsedAt) : $t('admin.integrations.table.never')
      }}</span>
      <span class="block text-xs">{{
        $t('admin.integrations.table.expiresOn', {
          date: row.expiresAt ? dateOf(row.expiresAt) : $t('admin.integrations.table.noExpiry'),
        })
      }}</span>
    </template>
    <template #cell-cidrs="{ row }">
      <span class="font-mono text-xs break-all">{{ row.allowedCidrs.join(', ') }}</span>
    </template>
    <template #actions="{ row }">
      <button
        v-if="!row.revokedAt"
        type="button"
        :class="buttonClass('danger', 'sm')"
        :aria-label="$t('admin.integrations.table.revokeLabel', { name: row.name })"
        :aria-disabled="isLocked || undefined"
        @click="isLocked || $emit('revoke', row)"
      >
        {{ $t('admin.integrations.table.revoke') }}
      </button>
    </template>
    <template #empty><slot name="empty" /></template>
  </AdminDataTable>
</template>
