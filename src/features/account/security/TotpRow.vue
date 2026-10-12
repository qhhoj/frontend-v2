<script setup lang="ts">
import Chip from '@/components/ui/Chip.vue';
import { Smartphone } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { translate } from '@/i18n';
import { useSessionStore } from '@/stores/session.store';
import DisableTotpDialog from './DisableTotpDialog.vue';
import { useScratchCodesRemainingQuery } from './security.queries';

/** The authenticator-app row of "Xác thực hai bước" (boards SetSecurityA and B). `busy`: a wizard or the regenerate card is open. */
defineProps<{ busy: boolean }>();
const emit = defineEmits<{ enable: []; regenerate: []; disabled: [] }>();
const session = useSessionStore();
const enabled = computed(() => session.user?.isTotpEnabled ?? false);
const confirmingRegenerate = ref(false);
const disabling = ref(false);
const remaining = useScratchCodesRemainingQuery();
/** One code left is the last chance to regenerate before a lost phone locks the account. */
const LOW_CODES = 1;
const remainingCount = computed(() =>
  enabled.value ? remaining.data.value?.remaining : undefined,
);
const lowOnCodes = computed(
  () => remainingCount.value !== undefined && remainingCount.value <= LOW_CODES,
);
/** The count line: none left, low, or the plain count. Undefined while the count is unknown. */
const remainingText = computed(() => {
  const count = remainingCount.value;
  if (count === undefined) return null;
  if (count === 0) return translate('settings.totp.remainingNone');
  return translate(lowOnCodes.value ? 'settings.totp.remainingLow' : 'settings.totp.remaining', {
    count,
  });
});

function regenerate() {
  confirmingRegenerate.value = false;
  emit('regenerate');
}
</script>

<template>
  <li class="flex flex-wrap items-center gap-3.5 border-t border-line py-3.5 first:border-t-0">
    <span
      aria-hidden="true"
      class="flex size-10 shrink-0 items-center justify-center rounded-cell"
      :class="enabled ? 'bg-verdict-ac-bg text-positive' : 'bg-accent-soft text-accent-text'"
    >
      <Smartphone class="size-[18px]" />
    </span>
    <span class="flex min-w-0 flex-1 flex-col gap-0.5">
      <strong class="font-semibold">{{ $t('settings.totp.title') }}</strong>
      <span class="text-meta text-muted">{{
        enabled ? $t('settings.totp.descriptionOn') : $t('settings.totp.descriptionOff')
      }}</span>
      <span
        v-if="remainingText"
        class="text-meta"
        :class="lowOnCodes ? 'font-semibold text-negative' : 'text-muted'"
        >{{ remainingText }}</span
      >
    </span>
    <Chip v-if="enabled" tone="success">{{ $t('settings.twoFactor.on') }}</Chip>
    <span class="flex flex-wrap gap-2">
      <AppButton v-if="!enabled" tone="primary" :disabled="busy" @click="emit('enable')">
        {{ $t('settings.totp.enable') }}
      </AppButton>
      <template v-else>
        <AppButton :disabled="busy" @click="confirmingRegenerate = true">
          {{ $t('settings.totp.regenerate') }}
        </AppButton>
        <AppButton tone="danger" :disabled="busy" @click="disabling = true">
          {{ $t('settings.totp.disable') }}
        </AppButton>
      </template>
    </span>
    <ConfirmDialog
      v-model:visible="confirmingRegenerate"
      :title="$t('settings.totp.regenerateTitle')"
      :body="$t('settings.totp.regenerateBody')"
      :confirm-label="$t('settings.totp.continue')"
      @confirm="regenerate"
    />
    <DisableTotpDialog v-model:visible="disabling" @disabled="emit('disabled')" />
  </li>
</template>
