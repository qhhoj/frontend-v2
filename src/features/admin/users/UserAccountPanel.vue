<script setup lang="ts">
import { ref } from 'vue';
import type { UserPage } from '@/api/types/users';
import type { UserEdit } from '@/api/types/users-admin';
import CopyButton from '@/components/CopyButton.vue';
import { BUTTON } from '../ui/controls';
import ImpersonateDialog from './ImpersonateDialog.vue';
import UserActivationRow from './UserActivationRow.vue';
import UserDangerRow from './UserDangerRow.vue';
import UserModerationPanel from './UserModerationPanel.vue';
import UserRenameForm from './UserRenameForm.vue';
import { useUserDrawerAccess } from './use-user-drawer-access';

/**
 * The Tài khoản tab: the account's facts and rename, then the danger zone (deactivate, ban, impersonate). `edit` is
 * loaded only for an editor; without it the tab holds what `judge.ban_user` allows.
 */
const props = defineProps<{ page: UserPage; edit?: UserEdit }>();
const emit = defineEmits<{ renamed: [username: string] }>();
const access = useUserDrawerAccess(() => props.page);
const isImpersonateOpen = ref(false);
</script>

<template>
  <div class="flex flex-col gap-6">
    <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
      <div class="col-span-2 sm:col-span-4">
        <dt class="text-muted">{{ $t('admin.users.card.facts.id') }}</dt>
        <dd class="flex items-center gap-2">
          <code class="min-w-0 font-mono text-sm break-all">{{ page.id }}</code>
          <CopyButton
            class="shrink-0"
            icon-only-on-phone
            :text="page.id"
            :label="$t('admin.users.card.copyId')"
          />
        </dd>
      </div>
      <div>
        <dt class="text-muted">{{ $t('admin.users.card.facts.rank') }}</dt>
        <dd class="font-semibold">{{ page.displayRank }}</dd>
      </div>
      <div>
        <dt class="text-muted">{{ $t('admin.users.card.facts.rating') }}</dt>
        <dd class="font-mono font-semibold">{{ page.rating ?? $t('admin.users.card.none') }}</dd>
      </div>
      <div>
        <dt class="text-muted">{{ $t('admin.users.card.facts.solved') }}</dt>
        <dd class="font-mono font-semibold">{{ page.problemCount }}</dd>
      </div>
      <div class="min-w-0">
        <dt class="text-muted">{{ $t('admin.users.card.facts.organization') }}</dt>
        <dd class="truncate font-semibold">
          {{ page.organizations[0]?.name ?? $t('admin.users.card.none') }}
        </dd>
      </div>
    </dl>
    <UserRenameForm
      v-if="edit && access.canCredentials.value"
      :username="edit.username"
      @renamed="(name) => emit('renamed', name)"
    />
    <section
      class="flex flex-col rounded-row border border-negative px-4 py-4"
      :aria-label="$t('admin.users.edit.danger')"
    >
      <h3 class="mb-2 font-display text-base font-semibold text-negative">
        {{ $t('admin.users.edit.danger') }}
      </h3>
      <div class="flex flex-col divide-y divide-line">
        <UserActivationRow v-if="edit && access.canCredentials.value" :user="edit" />
        <UserModerationPanel v-if="access.canModerate.value" :key="page.username" :user="page" />
        <UserDangerRow
          v-if="access.canImpersonateUser.value"
          :title="$t('admin.users.impersonate.title')"
          :text="$t('admin.users.impersonate.note')"
        >
          <button type="button" :class="BUTTON.danger" @click="isImpersonateOpen = true">
            {{ $t('admin.users.impersonate.open', { username: page.username }) }}
          </button>
        </UserDangerRow>
      </div>
    </section>
    <ImpersonateDialog
      v-model:visible="isImpersonateOpen"
      :username="page.username"
      :user-id="page.id"
    />
  </div>
</template>
