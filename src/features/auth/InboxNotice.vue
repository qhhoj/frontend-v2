<script setup lang="ts">
import { RotateCw } from 'lucide-vue-next';
import { ref } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import AuthError from './AuthError.vue';
import { useAuthAction } from './use-auth-action';
import { useCooldown } from './use-cooldown';

/** The "Kiểm tra hộp thư" body: where the mail went (one status) and a resend button that cools down after each send. */
const props = defineProps<{ resend: () => Promise<unknown> }>();
const { coolingDown, remainingText, start } = useCooldown();
const { pending, summary, run } = useAuthAction();
const resent = ref(false);
// The mail was just sent when this card appears, so the first render already shows the cooldown.
start();

async function resendMail() {
  if (coolingDown.value || pending.value) return;
  const sentAgain = await run(props.resend);
  resent.value = sentAgain;
  if (sentAgain) start();
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div role="status" class="flex flex-col gap-2 text-center text-sm leading-relaxed text-muted">
      <slot />
      <p v-if="resent" class="font-semibold text-content">{{ $t('auth.inbox.resent') }}</p>
    </div>
    <AuthError :text="summary" />
    <AppButton block :disabled="coolingDown || pending" @click="resendMail">
      <template #icon><RotateCw aria-hidden="true" class="size-[18px]" /></template>
      <template v-if="coolingDown">{{
        $t('auth.inbox.resendIn', { time: remainingText })
      }}</template>
      <template v-else>{{ $t('auth.inbox.resend') }}</template>
    </AppButton>
  </div>
</template>
