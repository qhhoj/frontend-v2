<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { useSessionStore } from '@/stores/session.store';
import { failureTextOf } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import AdminStatus from '../ui/AdminStatus.vue';

const props = defineProps<{ username: string; userId: string }>();
const visible = defineModel<boolean>('visible', { required: true });
const { t } = useI18n();
const router = useRouter();
const session = useSessionStore();

/** The session switches to the account; the staff cache is dropped by `useAccountCacheSync`, and the page goes home under the impersonation bar. */
const start = useAdminMutation({
  mutate: (userId: string) => session.startImpersonating(userId),
  onDone: () => {
    void router.push('/');
  },
});

/** A 403 is the backend's refusal of a superuser target, a banned target or a second impersonation; the text says so. */
const refusal = computed(() => {
  const error = start.failure.value;
  if (error === null) return null;
  return error.status === 403 ? t('admin.users.impersonate.refused') : failureTextOf(error);
});

/** The dialog closes only when the session took over: a refusal keeps it open with the text. */
async function confirmStart() {
  await start.run(props.userId);
  if (start.failure.value === null) visible.value = false;
}
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="t('admin.users.impersonate.dialog.title', { username })"
    :body="t('admin.users.impersonate.dialog.body', { username })"
    :confirm-label="t('admin.users.impersonate.dialog.confirm')"
    tone="danger"
    :busy="start.isPending.value"
    @confirm="confirmStart"
  >
    <ul class="list-disc pl-5 text-sm text-muted">
      <li>{{ t('admin.users.impersonate.dialog.nested') }}</li>
      <li>{{ t('admin.users.impersonate.dialog.lastLogin') }}</li>
    </ul>
    <template #error>
      <AdminStatus v-if="refusal" kind="refused" :text="refusal" />
    </template>
  </ConfirmDialog>
</template>
