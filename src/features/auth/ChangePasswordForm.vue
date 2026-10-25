<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue';
import { changePassword } from '@/api/auth.api';
import { useSessionStore } from '@/stores/session.store';
import AuthError from './AuthError.vue';
import AuthField from './AuthField.vue';
import AuthSubmit from './AuthSubmit.vue';
import NewPasswordPair from './NewPasswordPair.vue';
import { useAuthAction } from './use-auth-action';

/**
 * Current password plus the new pair. Once the backend accepted the change (`accepted`: the fields hide, the old password
 * is dead) it runs `afterChange` (reload the session, maybe leave): resolved is `changed`; rejected is `reloadFailed`, and the
 * button, now "Thử lại", re-runs `afterChange` only, never the change. The form does not reset itself: remount it for a new change.
 */
const props = defineProps<{ afterChange: () => Promise<void> }>();
const emit = defineEmits<{ accepted: []; changed: []; reloadFailed: [] }>();
const session = useSessionStore();
const form = reactive({ currentPassword: '', newPassword: '', confirmation: '' });
const formElement = ref<HTMLFormElement | null>(null);
const accepted = ref(false);
const { pending, fieldErrors, summary, run, dismiss, focusFirstInvalid } = useAuthAction(
  formElement,
  ['currentPassword', 'newPassword'],
);
const owner = computed(() => ({ username: session.user?.username, email: session.user?.email }));
const passwordsMatch = computed(() => form.newPassword === form.confirmation);

/** A failed reload is not a failed change: the password is already new, so the form must not come back with the old one. */
async function finish() {
  try {
    await props.afterChange();
  } catch {
    emit('reloadFailed');
    return;
  }
  emit('changed');
}

async function changeThenFinish() {
  await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
  accepted.value = true;
  emit('accepted');
  await finish();
}

async function submit() {
  if (accepted.value) return run(finish);
  if (!passwordsMatch.value) {
    await nextTick();
    return focusFirstInvalid();
  }
  await run(changeThenFinish);
}
</script>

<template>
  <form
    ref="formElement"
    data-step="change-password"
    class="flex flex-col gap-[18px]"
    @submit.prevent="submit"
  >
    <!-- Password managers file the saved entry under the username; this field is never shown or edited. -->
    <input
      type="text"
      name="username"
      autocomplete="username"
      :value="session.user?.username"
      readonly
      tabindex="-1"
      aria-hidden="true"
      class="sr-only"
    />
    <template v-if="!accepted">
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
    </template>
    <AuthError :text="summary" />
    <AuthSubmit :pending="pending">{{
      accepted ? $t('common.retry') : $t('auth.changePassword.submit')
    }}</AuthSubmit>
  </form>
</template>
