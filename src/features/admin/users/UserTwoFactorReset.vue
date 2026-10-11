<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQueryClient } from '@tanstack/vue-query';
import { resetUserTwoFactor } from '@/api/users-admin.api';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { failureTextOf } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import AdminStatus from '../ui/AdminStatus.vue';
import { BUTTON } from '../ui/controls';
import { invalidateUserModeration } from './users.queries';

/** Removes the account's authenticator and security keys (`judge.ban_user`), after a confirm. */
const props = defineProps<{ username: string; hasTwoFactor: boolean }>();
const { t } = useI18n();
const queryClient = useQueryClient();
const isConfirmOpen = ref(false);
const reset = useAdminMutation({
  mutate: () => resetUserTwoFactor(props.username),
  successText: () => t('admin.users.edit.account.twoFactorDone'),
  onDone: () => {
    isConfirmOpen.value = false;
    void invalidateUserModeration(queryClient, props.username);
  },
});
const refusal = computed(() => (reset.failure.value ? failureTextOf(reset.failure.value) : null));
</script>

<template>
  <section class="flex flex-col gap-3" :aria-label="$t('admin.users.edit.account.twoFactor')">
    <h3 class="font-display text-base font-semibold">
      {{ $t('admin.users.edit.account.twoFactor') }}
    </h3>
    <p class="text-sm text-muted">{{ $t('admin.users.edit.account.twoFactorNote') }}</p>
    <button
      v-if="hasTwoFactor"
      type="button"
      :class="BUTTON.danger"
      class="self-start"
      @click="isConfirmOpen = true"
    >
      {{ $t('admin.users.edit.account.twoFactor') }}
    </button>
    <AdminStatus v-if="refusal" kind="refused" :text="refusal" />
    <ConfirmDialog
      v-model:visible="isConfirmOpen"
      :title="$t('admin.users.edit.account.twoFactorDialog.title', { username })"
      :body="$t('admin.users.edit.account.twoFactorDialog.body')"
      :confirm-label="$t('admin.users.edit.account.twoFactor')"
      tone="danger"
      :busy="reset.isPending.value"
      @confirm="reset.run(undefined)"
    />
  </section>
</template>
