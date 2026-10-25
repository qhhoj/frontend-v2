<script setup lang="ts">
/** Only for a viewer whose password is in a breach list: the guard sends them here from every page until it is changed. The voluntary change lives in the security settings. */
import { LogOut } from 'lucide-vue-next';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import InlineBit from '@/components/InlineBit.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { safeRedirect } from '@/router/safe-redirect';
import { useSessionStore } from '@/stores/session.store';
import { useLogout } from './use-logout';
import AuthLayout from './AuthLayout.vue';
import AuthNotice from './AuthNotice.vue';
import ChangePasswordForm from './ChangePasswordForm.vue';

const route = useRoute();
const router = useRouter();
const session = useSessionStore();
/** The server has the new password, but this tab has not reloaded the session yet: only "try again" is left. */
const passwordChanged = ref(false);
const sessionStale = ref(false);

/** The form's `afterChange`: reload the session (the guard reads the breach flag from it). A failure rejects, so the form stays "accepted" and says so through `reloadFailed`. */
async function reloadSession() {
  sessionStale.value = false;
  await session.refresh();
}
/** Back to where the guard took the viewer from. */
const returnToPage = () => router.push(safeRedirect(route.query.redirect));

/** Straight to sign-in: the default first sends a viewer on an account page home, a page this screen then leaves at once. */
const signOut = useLogout(() => router.push({ name: 'login' }));
</script>

<template>
  <AuthLayout :title="$t('auth.changePassword.titleForced')" width="medium">
    <template #header-end>
      <AppButton @click="signOut">
        <template #icon><LogOut aria-hidden="true" class="size-4" /></template>
        {{ $t('account.logout') }}
      </AppButton>
    </template>
    <div v-if="!passwordChanged" class="flex items-center gap-3">
      <InlineBit kind="sweat" class="shrink-0" />
      <AuthNotice tone="warning" class="flex-1">
        <i18n-t keypath="auth.changePassword.breached" tag="span">
          <template #username>
            <strong class="font-mono text-content">{{ session.user?.username }}</strong>
          </template>
        </i18n-t>
      </AuthNotice>
    </div>
    <AuthNotice v-if="sessionStale" tone="success">{{
      $t('auth.changePassword.changedNotLoaded')
    }}</AuthNotice>
    <ChangePasswordForm
      :after-change="reloadSession"
      @accepted="passwordChanged = true"
      @reload-failed="sessionStale = true"
      @changed="returnToPage"
    />
  </AuthLayout>
</template>
