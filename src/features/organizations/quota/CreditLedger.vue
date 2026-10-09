<script setup lang="ts">
import type { CreditEntry } from '@/api/types/organization-usage';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import { actorName } from '@/lib/actor';
import { formatNumericDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { ORG_BITS } from '../org-bits';
import { ledgerAmountText, ledgerReasonKey } from './quota-text';

/** The last ledger rows of the month (at most 20, newest first, as the server sends them). */
defineProps<{ entries: CreditEntry[]; monthText: string }>();
const locale = useLocaleStore();
const CELL = 'py-2 pr-3 align-middle';
</script>

<template>
  <GlassCard
    as="section"
    data-testid="credit-ledger"
    aria-labelledby="credit-ledger-title"
    class="flex flex-col gap-3 rounded-panel p-5"
  >
    <h2 id="credit-ledger-title" class="font-display text-lg font-semibold">
      {{ $t('orgQuota.ledger', { month: monthText }) }}
    </h2>
    <EmptyState v-if="entries.length === 0" compact :kind="ORG_BITS.ledgerEmpty">
      {{ $t('orgQuota.ledgerEmpty') }}
    </EmptyState>
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="text-muted">
          <tr>
            <th scope="col" :class="CELL">{{ $t('orgQuota.columns.at') }}</th>
            <th scope="col" :class="CELL">{{ $t('orgQuota.columns.reason') }}</th>
            <th scope="col" :class="CELL" class="text-right">
              {{ $t('orgQuota.columns.amount') }}
            </th>
            <th scope="col" class="py-2">{{ $t('orgQuota.columns.actor') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(entry, index) in entries" :key="index" class="border-t border-line">
            <td :class="CELL" class="whitespace-nowrap tabular-nums">
              {{ formatNumericDateTime(entry.createdAt, locale.locale) }}
            </td>
            <td :class="CELL">
              {{ $t(ledgerReasonKey(entry.reason)) }}
              <span v-if="entry.ref" class="font-mono text-xs text-muted">· {{ entry.ref }}</span>
            </td>
            <td :class="CELL" class="text-right font-semibold tabular-nums">
              {{ ledgerAmountText(entry.amount, locale.locale) }}
            </td>
            <td class="py-2 text-muted">{{ actorName(entry.actor) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </GlassCard>
</template>
