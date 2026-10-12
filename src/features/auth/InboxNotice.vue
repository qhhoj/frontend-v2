<script setup lang="ts">
import { RotateCw } from 'lucide-vue-next';
import { ref } from 'vue';
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
    <button
      type="button"
      :aria-disabled="coolingDown || pending ? 'true' : undefined"
      class="flex h-12 w-full items-center justify-center gap-2 rounded-pill border border-line-strong bg-surface-solid font-display text-sm font-semibold text-content hover:bg-surface-hover aria-disabled:bg-surface-strong aria-disabled:text-muted"
      @click="resendMail"
    >
      <RotateCw aria-hidden="true" class="size-[18px]" />
      <template v-if="coolingDown">{{
        $t('auth.inbox.resendIn', { time: remainingText })
      }}</template>
      <template v-else>{{ $t('auth.inbox.resend') }}</template>
    </button>
  </div>
</template>
