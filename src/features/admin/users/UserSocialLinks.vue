<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQueryClient } from '@tanstack/vue-query';
import { removeUserSocialLinks } from '@/api/users-admin.api';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { SOCIAL_PROVIDER_LABELS } from '@/features/auth/social-providers';
import { failureTextOf } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import AdminStatus from '../ui/AdminStatus.vue';
import { invalidateUserModeration } from './users.queries';

/** Unlinks every Google, GitHub or Facebook sign-in of the account (`auth.change_user`) and ends its sessions, after a confirm. */
const props = defineProps<{ username: string; providers: string[] }>();
const { t } = useI18n();
const queryClient = useQueryClient();
const isConfirmOpen = ref(false);
const names = computed(() =>
  props.providers
    .map((slug) => (SOCIAL_PROVIDER_LABELS as Record<string, string>)[slug] ?? slug)
    .join(', '),
);
const remove = useAdminMutation({
  mutate: () => removeUserSocialLinks(props.username),
  successText: () => t('admin.users.edit.account.socialDone'),
  onDone: () => {
    isConfirmOpen.value = false;
    void invalidateUserModeration(queryClient, props.username);
  },
});
const refusal = computed(() => (remove.failure.value ? failureTextOf(remove.failure.value) : null));
</script>

<template>
  <section class="flex flex-col gap-3" :aria-label="$t('admin.users.edit.account.social')">
    <h3 class="font-display text-base font-semibold">
      {{ $t('admin.users.edit.account.social') }}
    </h3>
    <p class="text-sm text-muted">
      {{
        providers.length
          ? $t('admin.users.edit.account.socialLinked', { providers: names })
          : $t('admin.users.edit.account.socialNone')
      }}
    </p>
    <AppButton
      v-if="providers.length"
      tone="danger"
      class="self-start"
      @click="isConfirmOpen = true"
    >
      {{ $t('admin.users.edit.account.socialRemove') }}
    </AppButton>
    <AdminStatus v-if="refusal" kind="refused" :text="refusal" />
    <ConfirmDialog
      v-model:visible="isConfirmOpen"
      :title="$t('admin.users.edit.account.socialDialog.title', { username })"
      :body="$t('admin.users.edit.account.socialDialog.body')"
      :confirm-label="$t('admin.users.edit.account.socialRemove')"
      tone="danger"
      :busy="remove.isPending.value"
      @confirm="remove.run(undefined)"
    />
  </section>
</template>
