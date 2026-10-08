<script setup lang="ts">
import { Smartphone } from 'lucide-vue-next';
import { computed } from 'vue';
import { useSessionStore } from '@/stores/session.store';
import { BUTTON } from '../settings/buttons';

/** The authenticator-app row of "Xác thực hai bước"; Task 10 adds regenerate and turn-off. */
defineProps<{ busy: boolean }>();
const emit = defineEmits<{ enable: [] }>();
const session = useSessionStore();
const enabled = computed(() => session.user?.isTotpEnabled ?? false);
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
    </span>
  </li>
</template>
