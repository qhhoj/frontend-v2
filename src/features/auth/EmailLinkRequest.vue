<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { maskEmail } from '@/lib/mask-email';
import { focusMain } from '@/router/focus-main';
import AuthError from './AuthError.vue';
import AuthField from './AuthField.vue';
import AuthSubmit from './AuthSubmit.vue';
import InboxNotice from './InboxNotice.vue';
import { useAuthAction } from './use-auth-action';

/**
 * "Email me a link" (resend activation, forgot password): both endpoints answer 204 whatever the address, so the
 * sent card never says whether an account exists. After a send the form gives way to `InboxNotice`.
 */
const props = defineProps<{ send: (email: string) => Promise<unknown>; submitText: string }>();
const emit = defineEmits<{ sent: [] }>();
const email = ref('');
const sentTo = ref('');
const sent = ref(false);
const formElement = ref<HTMLFormElement | null>(null);
const { pending, fieldErrors, summary, run, dismiss } = useAuthAction(formElement, ['email']);

const resendMail = () => props.send(sentTo.value);

async function submit() {
  const address = email.value;
  if (!(await run(() => props.send(address)))) return;
  sentTo.value = address;
  sent.value = true;
  emit('sent');
  await nextTick();
  focusMain(); // the form is gone; focus must not fall to the body
}
</script>

<template>
  <InboxNotice v-if="sent" :resend="resendMail">
    <slot name="sent" :email="maskEmail(sentTo)" />
  </InboxNotice>
  <form v-else ref="formElement" class="flex flex-col gap-4" @submit.prevent="submit">
    <AuthField
      v-model="email"
      type="email"
      name="email"
      :label="$t('auth.email')"
      autocomplete="email"
      inputmode="email"
      placeholder="ban@example.com"
      :error="fieldErrors.email"
      required
      spellcheck="false"
      @input="dismiss('email')"
    />
    <AuthError :text="summary" />
    <AuthSubmit :pending="pending">{{ submitText }}</AuthSubmit>
  </form>
</template>
