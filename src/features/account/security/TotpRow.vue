<script setup lang="ts">
import { Smartphone } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { translate } from '@/i18n';
import { useSessionStore } from '@/stores/session.store';
import { BUTTON } from '../settings/buttons';
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
      <span class="text-[13px] text-muted">{{
        enabled ? $t('settings.totp.descriptionOn') : $t('settings.totp.descriptionOff')
      }}</span>
      <span
        v-if="remainingText"
        class="text-[13px]"
        :class="lowOnCodes ? 'font-semibold text-negative' : 'text-muted'"
        >{{ remainingText }}</span
      >
    </span>
    <span
      v-if="enabled"
      class="rounded-pill bg-verdict-ac-bg px-2.5 py-0.5 text-xs font-semibold text-verdict-ac"
      >{{ $t('settings.twoFactor.on') }}</span
    >
    <span class="flex flex-wrap gap-2">
      <button
        v-if="!enabled"
        type="button"
        :class="BUTTON.primary"
        :aria-disabled="busy"
        @click="busy || emit('enable')"
      >
        {{ $t('settings.totp.enable') }}
      </button>
      <template v-else>
        <button
          type="button"
          :class="BUTTON.secondary"
          :aria-disabled="busy"
          @click="busy || (confirmingRegenerate = true)"
        >
          {{ $t('settings.totp.regenerate') }}
        </button>
        <button
          type="button"
          :class="BUTTON.danger"
          :aria-disabled="busy"
          @click="busy || (disabling = true)"
        >
          {{ $t('settings.totp.disable') }}
        </button>
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
