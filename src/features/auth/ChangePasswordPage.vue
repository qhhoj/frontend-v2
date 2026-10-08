<script setup lang="ts">
import { LogOut } from 'lucide-vue-next';
import { computed, nextTick, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { changePassword } from '@/api/auth.api';
import InlineBit from '@/components/InlineBit.vue';
import { safeRedirect } from '@/router/safe-redirect';
import { useSessionStore } from '@/stores/session.store';
import AuthError from './AuthError.vue';
import AuthField from './AuthField.vue';
import AuthLayout from './AuthLayout.vue';
import AuthNotice from './AuthNotice.vue';
import AuthSubmit from './AuthSubmit.vue';
import NewPasswordPair from './NewPasswordPair.vue';
import { useAuthAction } from './use-auth-action';

const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const form = reactive({ currentPassword: '', newPassword: '', confirmation: '' });
const formElement = ref<HTMLFormElement | null>(null);
const { pending, fieldErrors, summary, run, dismiss, focusFirstInvalid } = useAuthAction(
  formElement,
  ['currentPassword', 'newPassword'],
);
/** The viewer's password is in a breach list: the guard sends them here from every page until it is changed. */
const forced = computed(() => session.passwordChangeRequired);
const owner = computed(() => ({ username: session.user?.username, email: session.user?.email }));
const passwordsMatch = computed(() => form.newPassword === form.confirmation);

async function submit() {
  if (!passwordsMatch.value) {
    await nextTick();
    return focusFirstInvalid();
  }
  await run(async () => {
    await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
    // The server cleared the breach flag on this session; reload it so the guard lets the viewer through.
    await session.refresh();
    await router.push(safeRedirect(route.query.redirect));
  });
}

/** Not `useLogout`: it first sends a viewer on an account page home, a page this screen then leaves at once. */
async function signOut() {
  await session.logout();
  await router.push({ name: 'login' });
}
</script>

<template>
  <AuthLayout
    :title="forced ? $t('auth.changePassword.titleForced') : $t('auth.changePassword.title')"
    :lead="forced ? undefined : $t('auth.changePassword.lead')"
    width="medium"
  >
    <template v-if="forced" #header-end>
      <button
        type="button"
        class="flex h-11 items-center gap-2 rounded-pill border border-line-strong bg-surface-solid px-4 font-semibold hover:bg-surface-hover"
        @click="signOut"
      >
        <LogOut aria-hidden="true" class="size-4" />{{ $t('account.logout') }}
      </button>
    </template>
    <div v-if="forced" class="flex items-center gap-3">
      <InlineBit kind="sweat" class="shrink-0" />
      <AuthNotice tone="warning" class="flex-1">{{
        $t('auth.changePassword.breached', { username: session.user?.username ?? '' })
      }}</AuthNotice>
    </div>
    <form ref="formElement" class="flex flex-col gap-[18px]" @submit.prevent="submit">
      <AuthField
        v-model="form.currentPassword"
        type="password"
        name="currentPassword"
        :label="$t('auth.changePassword.currentPassword')"
        autocomplete="current-password"
        placeholder="••••••••"
        :error="fieldErrors.currentPassword"
        required
        @input="dismiss('currentPassword')"
      />
      <NewPasswordPair
        v-model:password="form.newPassword"
        v-model:confirmation="form.confirmation"
        :confirm-label="$t('auth.changePassword.confirmNew')"
        :owner="owner"
        :error="fieldErrors.newPassword"
        @input="dismiss('newPassword')"
      />
      <AuthError :text="summary" />
      <AuthSubmit :pending="pending">{{ $t('auth.changePassword.submit') }}</AuthSubmit>
    </form>
  </AuthLayout>
</template>
