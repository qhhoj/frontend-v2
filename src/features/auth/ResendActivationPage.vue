<script setup lang="ts">
import { ref } from 'vue';
import { resendActivation } from '@/api/auth.api';
import InlineBit from '@/components/InlineBit.vue';
import AuthLayout from './AuthLayout.vue';
import EmailLinkRequest from './EmailLinkRequest.vue';

const sent = ref(false);
</script>

<template>
  <AuthLayout
    :title="sent ? $t('auth.inbox.title') : $t('auth.resend.title')"
    :lead="sent ? undefined : $t('auth.resend.lead')"
    :centered="sent"
  >
    <template v-if="sent" #badge>
      <InlineBit kind="envelope" class="self-center" />
    </template>
    <EmailLinkRequest
      :send="resendActivation"
      :submit-text="$t('auth.resend.send')"
      @sent="sent = true"
    >
      <template #sent="{ email }">
        <p>{{ $t('auth.resend.sent', { email }) }}</p>
      </template>
    </EmailLinkRequest>
    <p class="text-center text-sm">
      <RouterLink :to="{ name: 'login' }" class="font-semibold text-accent-text underline">{{
        $t('auth.backToLogin')
      }}</RouterLink>
    </p>
  </AuthLayout>
</template>
