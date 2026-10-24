<script setup lang="ts">
import { computed } from 'vue';
import type { OrganizationUsage } from '@/api/types/organization-usage';
import SettingsNotice from '@/features/account/settings/SettingsNotice.vue';
import { monthLabel, nextMonthStart } from '@/lib/quota';
import { translate } from '@/i18n';
import { useLocaleStore } from '@/stores/locale.store';
import { ORG_BITS } from '../org-bits';
import { quotaNoticeOf } from './quota-text';

/** The banner: healthy, 80 % warning (with warn or enforce wording) or the blocking notice. */
const props = defineProps<{ usage: OrganizationUsage }>();
const state = computed(() => quotaNoticeOf(props.usage));
const locale = useLocaleStore();
const TONES = { healthy: 'info', near: 'warning', blocked: 'error' } as const;
const BITS = {
  healthy: ORG_BITS.quotaHealthy,
  near: ORG_BITS.quotaNear,
  blocked: ORG_BITS.quotaBlocked,
} as const;
const modeText = computed(() =>
  translate(props.usage.enforcing ? 'orgQuota.enforceMode' : 'orgQuota.warnMode'),
);
const headline = computed(() => {
  const { kind, meter, percent } = state.value;
  if (props.usage.unlimited) return translate('orgQuota.unlimited');
  if (kind === 'healthy' || meter === null) return translate('orgQuota.healthy');
  const meterName = translate(`orgQuota.meters.${meter}`);
  return kind === 'near'
    ? translate('orgQuota.near', {
        percent,
        meter: meterName,
        month: monthLabel(props.usage.month, locale.locale),
      })
    : translate('orgQuota.blocked', { meter: meterName });
});
const detail = computed(() => {
  const { kind, meter } = state.value;
  if (props.usage.unlimited) return translate('orgQuota.unlimitedNotice');
  if (kind !== 'blocked') return modeText.value;
  if (meter === 'storage') return translate('orgQuota.blockedStorage');
  return translate('orgQuota.blockedCredits', {
    date: nextMonthStart(props.usage.month, locale.locale),
  });
});
</script>

<template>
  <SettingsNotice
    data-testid="quota-notice"
    :tone="TONES[state.kind]"
    :bit="BITS[state.kind]"
    :role="state.kind === 'blocked' ? 'alert' : 'status'"
  >
    <strong>{{ headline }}</strong> {{ detail }}
  </SettingsNotice>
</template>
