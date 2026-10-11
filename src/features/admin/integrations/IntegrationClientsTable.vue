<script setup lang="ts">
import ScrollRegion from '@/components/ScrollRegion.vue';
import type { IntegrationClient } from '@/api/types/integration-clients';
import { formatDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';

/** Keep `IntegrationClientsTableSkeleton.vue` in step. Below md only name, key, state and the action show. */
defineProps<{ clients: IntegrationClient[]; isLocked: boolean }>();
defineEmits<{ revoke: [client: IntegrationClient] }>();
const locale = useLocaleStore();
const CELL = 'px-3 py-2 align-middle';
const WIDE = 'hidden md:table-cell';
const dateOf = (value: string) => formatDateTime(value, locale.locale);
/** Revoked wins over expired: both end the key, but revoking is the staff's act. */
const stateOf = (client: IntegrationClient): 'revoked' | 'expired' | 'active' => {
  if (client.revokedAt) return 'revoked';
  return client.expiresAt && new Date(client.expiresAt).getTime() <= Date.now()
    ? 'expired'
    : 'active';
};
</script>

<template>
  <div
    id="integration-table"
    data-testid="integration-table"
    class="glass overflow-hidden rounded-card"
  >
    <ScrollRegion :label="$t('admin.integrations.table.region')">
      <table class="w-full border-collapse text-sm">
        <caption class="sr-only">
          {{
            $t('admin.integrations.table.caption')
          }}
        </caption>
        <thead>
          <tr class="text-left text-[13px] text-muted">
            <th scope="col" :class="CELL">{{ $t('admin.integrations.table.name') }}</th>
            <th scope="col" :class="CELL">{{ $t('admin.integrations.table.key') }}</th>
            <th scope="col" :class="[CELL, WIDE]">{{ $t('admin.integrations.table.scopes') }}</th>
            <th scope="col" :class="[CELL, WIDE]">{{ $t('admin.integrations.table.cidrs') }}</th>
            <th scope="col" :class="[CELL, WIDE]">{{ $t('admin.integrations.table.actsAs') }}</th>
            <th scope="col" :class="[CELL, WIDE]">{{ $t('admin.integrations.table.lastUsed') }}</th>
            <th scope="col" :class="[CELL, WIDE]">{{ $t('admin.integrations.table.expires') }}</th>
            <th scope="col" :class="CELL">{{ $t('admin.integrations.table.state') }}</th>
            <th scope="col" :class="CELL">
              <span class="sr-only">{{ $t('admin.integrations.table.revoke') }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="client in clients"
            :key="client.id"
            :data-client="client.id"
            class="border-t border-line"
          >
            <td :class="[CELL, 'font-semibold']">{{ client.name }}</td>
            <td :class="[CELL, 'font-mono']">{{ client.keyPrefix }}…</td>
            <td :class="[CELL, WIDE]">
              <code v-for="scope in client.scopes" :key="scope" class="block font-mono text-xs">{{
                scope
              }}</code>
            </td>
            <td :class="[CELL, WIDE, 'font-mono text-xs']">{{ client.allowedCidrs.join(', ') }}</td>
            <td :class="[CELL, WIDE]">{{ client.actsAs.username }}</td>
            <td :class="[CELL, WIDE, 'whitespace-nowrap text-muted']">
              {{
                client.lastUsedAt ? dateOf(client.lastUsedAt) : $t('admin.integrations.table.never')
              }}
            </td>
            <td :class="[CELL, WIDE, 'whitespace-nowrap']">
              {{
                client.expiresAt
                  ? dateOf(client.expiresAt)
                  : $t('admin.integrations.table.noExpiry')
              }}
            </td>
            <td :class="[CELL, 'whitespace-nowrap']">
              <span v-if="stateOf(client) === 'revoked'" class="font-semibold text-negative">{{
                $t('admin.integrations.table.revokedAt', { date: dateOf(client.revokedAt!) })
              }}</span>
              <span v-else-if="stateOf(client) === 'expired'" class="font-semibold text-negative">{{
                $t('admin.integrations.table.expiredAt', { date: dateOf(client.expiresAt!) })
              }}</span>
              <span v-else class="font-semibold text-positive">{{
                $t('admin.integrations.table.active')
              }}</span>
            </td>
            <td :class="CELL">
              <button
                v-if="!client.revokedAt"
                type="button"
                class="inline-flex min-h-11 items-center rounded-pill border border-line px-4 font-semibold text-negative hover:bg-surface-hover aria-disabled:cursor-not-allowed aria-disabled:text-muted"
                :aria-label="$t('admin.integrations.table.revokeLabel', { name: client.name })"
                :aria-disabled="isLocked || undefined"
                @click="isLocked || $emit('revoke', client)"
              >
                {{ $t('admin.integrations.table.revoke') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </ScrollRegion>
  </div>
</template>
