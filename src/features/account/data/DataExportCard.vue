<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { computed, useId } from 'vue';
import { DATA_EXPORT_DOWNLOAD_URL, requestDataExport } from '@/api/account.api';
import { ApiError } from '@/api/client';
import type { DataExportStatus } from '@/api/types/account';
import InlineBit from '@/components/InlineBit.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { useAuthAction } from '@/features/auth/use-auth-action';
import { translate } from '@/i18n';
import { formatFileSize } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import SettingsCard from '../settings/SettingsCard.vue';
import SettingsNotice from '../settings/SettingsNotice.vue';
import { daysLeft, exportFileOf, requestRuleOf, timeLeft } from './data-export';
import { DATA_EXPORT_KEY } from './data.queries';

/** The file (or why there is none), the last request, and the request button with the rule that governs it. */
const props = defineProps<{ status: DataExportStatus; username: string }>();
const CHIPS = {
  none: 'bg-verdict-pending-bg text-verdict-pending',
  expired: 'bg-verdict-tle-bg text-verdict-tle',
  preparing: 'bg-accent-soft text-accent-soft-text',
  ready: 'bg-verdict-ac-bg text-verdict-ac',
} as const;
const locale = useLocaleStore();
const now = useNow(60_000);
const queryClient = useQueryClient();
const ruleId = useId();
const { pending, error, summary, run } = useAuthAction();
const file = computed(() => exportFileOf(props.status));
const rule = computed(() => requestRuleOf(props.status));
const canRequest = computed(() => rule.value.kind === 'allowed' && !pending.value);
const when = (date: string) => formatDate(date, 'datetime', locale.locale);

const fileText = computed(() => {
  if (file.value.kind === 'preparing')
    return translate('settings.data.preparingText', {
      time: file.value.requestedAt ? when(file.value.requestedAt) : '—',
    });
  return file.value.kind === 'ready' ? null : translate(`settings.data.${file.value.kind}Text`);
});
const ruleText = computed(() => {
  if (rule.value.kind === 'wait')
    return translate('settings.data.waitFor', timeLeft(rule.value.until, now.value));
  return rule.value.kind === 'dailyLimit' ? translate('settings.data.dailyLimit') : null;
});
const buttonText = computed(() => {
  if (rule.value.kind === 'preparing') return translate('settings.data.preparing');
  return translate(
    file.value.kind === 'none' ? 'settings.data.requestFirst' : 'settings.data.requestAgain',
  );
});
const failureText = computed(() =>
  error.value instanceof ApiError && error.value.code === 'conflict'
    ? translate('settings.data.busy')
    : summary.value,
);

async function request() {
  if (!canRequest.value) return;
  await run(() => requestDataExport());
  // Success, 409 and 429 all change what the status says; read it again.
  await queryClient.invalidateQueries({ queryKey: DATA_EXPORT_KEY });
}
</script>

<template>
  <SettingsCard :title="$t('settings.data.title')" :lead="$t('settings.data.lead')">
    <template #header-end>
      <span class="rounded-pill px-2.5 py-0.5 text-xs font-semibold" :class="CHIPS[file.kind]">{{
        $t(`settings.data.state.${file.kind}`)
      }}</span>
    </template>
    <div
      v-if="file.kind === 'ready'"
      class="flex flex-wrap items-center gap-4 rounded-row border border-line bg-surface-strong p-4"
    >
      <InlineBit kind="crown" />
      <div class="min-w-0 flex-1">
        <strong class="font-mono break-all">{{ username }}-data.zip</strong>
        <p class="text-meta text-muted">
          {{
            $t('settings.data.fileFacts', {
              size: formatFileSize(file.size),
              time: when(file.readyAt),
            })
          }}
        </p>
      </div>
      <AppButton :href="DATA_EXPORT_DOWNLOAD_URL" download tone="primary">
        {{ $t('settings.data.download') }}
      </AppButton>
      <p class="w-full text-meta text-muted">
        {{
          $t('settings.data.expires', {
            time: when(file.expiresAt),
            days: daysLeft(file.expiresAt, now),
          })
        }}
      </p>
    </div>
    <p v-else class="text-sm">{{ fileText }}</p>
    <dl v-if="status.preparedAt" class="m-0 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
      <dt class="font-semibold sm:col-span-2">{{ $t('settings.data.lastRequest') }}</dt>
      <dt class="text-muted">{{ $t('settings.data.requestedAt') }}</dt>
      <dd class="m-0">{{ when(status.preparedAt) }}</dd>
      <template v-if="status.readyAt">
        <dt class="text-muted">{{ $t('settings.data.readyAt') }}</dt>
        <dd class="m-0">{{ when(status.readyAt) }}</dd>
      </template>
      <template v-if="status.nextPrepareAt">
        <dt class="text-muted">{{ $t('settings.data.nextAt') }}</dt>
        <dd class="m-0">{{ when(status.nextPrepareAt) }}</dd>
      </template>
    </dl>
    <SettingsNotice v-if="failureText" tone="error" bit="sweat">{{ failureText }}</SettingsNotice>
    <div class="flex flex-col items-start gap-1.5">
      <AppButton
        data-request-export
        tone="primary"
        :disabled="!canRequest"
        :aria-describedby="ruleText ? ruleId : undefined"
        @click="request"
      >
        {{ buttonText }}
      </AppButton>
      <p v-if="ruleText" :id="ruleId" class="text-meta text-muted">{{ ruleText }}</p>
    </div>
  </SettingsCard>
</template>
