<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { removeSocialLink } from '@/api/account.api';
import { ApiError } from '@/api/client';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Notice from '@/components/ui/Notice.vue';
import AuthError from '@/features/auth/AuthError.vue';
import AuthField from '@/features/auth/AuthField.vue';
import { SOCIAL_PROVIDER_LABELS } from '@/features/auth/social-providers';
import { useAuthAction } from '@/features/auth/use-auth-action';
import { translate } from '@/i18n';
import SettingsCard from '../settings/SettingsCard.vue';
import { SOCIAL_LINKS_KEY, useSocialLinksQuery } from './security.queries';

/** The social accounts that sign in to this account, each with "Gỡ liên kết". Left out while there is none. */
const links = useSocialLinksQuery();
const queryClient = useQueryClient();
const providers = computed(() => links.data.value?.providers ?? []);
const removing = ref<string | null>(null);
const confirming = ref(false);
const password = ref('');
const done = ref<string | null>(null);
const fieldsElement = ref<HTMLElement | null>(null);
const { pending, fieldErrors, summary, error, run, dismiss, reset } = useAuthAction(fieldsElement, [
  'currentPassword',
]);

/** A provider the build has no label for keeps its stored name. */
const providerName = (slug: string): string =>
  (SOCIAL_PROVIDER_LABELS as Record<string, string>)[slug] ?? slug;

/** The backend refuses with a 409 `password_unusable` issue when the account has no password to fall back on. */
const isPasswordUnusable = computed(
  () =>
    error.value instanceof ApiError &&
    error.value.issues.some((issue) => issue.code === 'password_unusable'),
);
const errorText = computed(() =>
  isPasswordUnusable.value ? translate('settings.social.passwordUnusable') : summary.value,
);

function askToRemove(slug: string) {
  removing.value = slug;
  password.value = '';
  reset();
  confirming.value = true;
}

async function remove() {
  const slug = removing.value;
  if (!slug) return;
  if (!(await run(() => removeSocialLink(slug, password.value)))) return;
  confirming.value = false;
  done.value = translate('settings.social.removed', { name: providerName(slug) });
  await queryClient.invalidateQueries({ queryKey: SOCIAL_LINKS_KEY });
}
</script>

<template>
  <SettingsCard
    v-if="providers.length || done"
    :title="$t('settings.social.title')"
    :lead="$t('settings.social.lead')"
  >
    <Notice v-if="done" tone="success">{{ done }}</Notice>
    <ul v-if="providers.length" class="m-0 flex list-none flex-col gap-2 p-0">
      <li
        v-for="slug in providers"
        :key="slug"
        data-social-link
        class="flex flex-wrap items-center gap-3 rounded-row border border-line bg-surface-strong px-3.5 py-2.5"
      >
        <strong class="min-w-0 flex-1 font-semibold break-words">{{ providerName(slug) }}</strong>
        <AppButton
          tone="danger"
          :aria-label="$t('settings.social.removeLabel', { name: providerName(slug) })"
          @click="askToRemove(slug)"
        >
          {{ $t('settings.social.remove') }}
        </AppButton>
      </li>
    </ul>
    <ConfirmDialog
      v-model:visible="confirming"
      tone="danger"
      :title="$t('settings.social.removeTitle', { name: providerName(removing ?? '') })"
      :body="$t('settings.social.removeBody', { name: providerName(removing ?? '') })"
      :confirm-label="$t('settings.social.remove')"
      :busy="pending"
      :can-confirm="password !== ''"
      @confirm="remove"
    >
      <div ref="fieldsElement">
        <AuthField
          v-model="password"
          type="password"
          name="removeSocialPassword"
          autocomplete="current-password"
          :label="$t('auth.changePassword.currentPassword')"
          :error="fieldErrors.currentPassword"
          @input="dismiss('currentPassword')"
        />
      </div>
      <template #error><AuthError :text="errorText" /></template>
    </ConfirmDialog>
  </SettingsCard>
</template>
