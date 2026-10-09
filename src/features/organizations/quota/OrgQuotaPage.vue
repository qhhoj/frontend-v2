<script setup lang="ts">
import { computed } from 'vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import StatePanel from '@/components/StatePanel.vue';
import { formatNumber } from '@/lib/format';
import { formatMebibytes, monthLabel } from '@/lib/quota';
import { useLocaleStore } from '@/stores/locale.store';
import { ORG_BITS } from '../org-bits';
import { useOrganization } from '../use-organization';
import CreditLedger from './CreditLedger.vue';
import { useOrganizationUsageQuery } from './org-quota.queries';
import QuotaMeterCard from './QuotaMeterCard.vue';
import QuotaNotice from './QuotaNotice.vue';

const locale = useLocaleStore();
const { slug, query: organizationQuery } = useOrganization();
const organization = computed(() => organizationQuery.data.value);
const isAdmin = computed(() => organization.value?.viewer?.canAdminister === true);
const usage = useOrganizationUsageQuery(slug, isAdmin);
const data = computed(() => usage.data.value);
const monthText = computed(() => (data.value ? monthLabel(data.value.month, locale.locale) : ''));
const mib = (bytes: number) => formatMebibytes(bytes, locale.locale);
const number = (value: number) => formatNumber(value, locale.locale);
</script>

<template>
  <StatePanel
    v-if="organization && !isAdmin"
    :kind="ORG_BITS.forbidden"
    :title="$t('orgQuota.forbiddenTitle')"
    :body="$t('orgQuota.forbiddenBody', { name: organization.name })"
  />
  <section v-else-if="organization" data-testid="org-quota" class="flex flex-col gap-5">
    <QueryState
      :loading="usage.isLoading.value"
      :error="usage.error.value"
      @retry="usage.refetch()"
    >
      <template #skeleton>
        <SkeletonBlock
          data-skeleton-region="quota-notice"
          class="h-[129px] w-full rounded-row md:h-[4.5rem]"
        />
        <div data-skeleton-region="quota-meters" class="grid gap-5 md:grid-cols-2">
          <SkeletonBlock class="h-[177px] w-full rounded-panel md:h-32" />
          <SkeletonBlock class="h-[149px] w-full rounded-panel md:h-32" />
        </div>
        <SkeletonBlock
          data-skeleton-region="credit-ledger"
          class="h-[606px] w-full rounded-panel md:h-64"
        />
      </template>
      <template v-if="data">
        <QuotaNotice :usage="data" />
        <div class="grid gap-5 md:grid-cols-2">
          <QuotaMeterCard
            :label="$t('orgQuota.credits', { month: monthText })"
            :meter="data.credits"
            :value-text="
              $t('orgQuota.creditsValue', {
                used: number(data.credits.used),
                limit: number(data.credits.limit),
              })
            "
            :detail="$t('orgQuota.creditsDetail')"
          />
          <QuotaMeterCard
            :label="$t('orgQuota.storage')"
            :meter="data.storage"
            :value-text="
              $t('orgQuota.storageValue', {
                used: mib(data.storage.used),
                limit: mib(data.storage.limit),
              })
            "
            :detail="
              $t('orgQuota.storageDetail', {
                left: mib(Math.max(0, data.storage.limit - data.storage.used)),
              })
            "
          />
        </div>
        <CreditLedger :entries="data.recent" :month-text="monthText" />
      </template>
    </QueryState>
  </section>
</template>
