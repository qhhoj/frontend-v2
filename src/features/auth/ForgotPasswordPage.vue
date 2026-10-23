<script setup lang="ts">
import { ref } from 'vue';
import { requestPasswordReset } from '@/api/auth.api';
import InlineBit from '@/components/InlineBit.vue';
import AuthLayout from './AuthLayout.vue';
import EmailLinkRequest from './EmailLinkRequest.vue';
import { AUTH_LINK } from './auth-link';

const sent = ref(false);
</script>

<template>
  <AuthLayout
    :title="sent ? $t('auth.inbox.title') : $t('auth.forgotPassword.title')"
    :lead="sent ? undefined : $t('auth.forgotPassword.lead')"
    :centered="sent"
    brand
  >
    <template #header-end>
      <RouterLink :to="{ name: 'login' }" :class="AUTH_LINK">{{
        $t('auth.submitLogin')
      }}</RouterLink>
    </template>
    <template v-if="sent" #badge>
      <InlineBit kind="envelope" class="self-center" />
    </template>
    <EmailLinkRequest
      :send="requestPasswordReset"
      :submit-text="$t('auth.forgotPassword.send')"
      @sent="sent = true"
    >
      <template #sent="{ email }">
        <p>{{ $t('auth.forgotPassword.sent', { email }) }}</p>
      </template>
    </EmailLinkRequest>
    <p class="text-center text-sm">
      <RouterLink :to="{ name: 'login' }" :class="AUTH_LINK">{{
        $t('auth.backToLogin')
      }}</RouterLink>
    </p>
  </AuthLayout>
</template>
