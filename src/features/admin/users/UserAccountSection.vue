<script setup lang="ts">
import { computed, ref } from 'vue';
import type { UserEdit } from '@/api/types/users-admin';
import { renameUser, resetUserTwoFactor, updateUserByStaff } from '@/api/users-admin.api';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { usePermissions } from '@/stores/use-permissions';
import { failureTextOf } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { ADMIN_BUTTON_CLASS, ADMIN_DANGER_CLASS, ADMIN_INPUT_CLASS } from '../ui/classes';

/** Account-level actions: activation and rename (`auth.change_user`), two-factor reset (`judge.ban_user`). */
const props = defineProps<{ user: UserEdit }>();
const emit = defineEmits<{ renamed: [username: string] }>();
const { can } = usePermissions();
const canAccount = computed(() => can('auth.change_user'));
const canResetTwoFactor = computed(() => can('judge.ban_user') && props.user.hasTwoFactor);
const isDeactivateOpen = ref(false);
const isTwoFactorOpen = ref(false);
const newName = ref(props.user.username);

const activation = useAdminMutation({
  mutate: (isActive: boolean) => updateUserByStaff(props.user.username, { isActive }),
  invalidates: () => [['admin', 'users']],
  onDone: () => {
    isDeactivateOpen.value = false;
  },
});
const rename = useAdminMutation({
  mutate: (username: string) => renameUser(props.user.username, username),
  invalidates: () => [['admin', 'users']],
  onDone: (result) => emit('renamed', result.username),
});
const twoFactor = useAdminMutation({
  mutate: () => resetUserTwoFactor(props.user.username),
  invalidates: () => [['admin', 'users']],
  onDone: () => {
    isTwoFactorOpen.value = false;
  },
});
const lineOf = (failure: unknown, fieldCount: number) =>
  failure && fieldCount === 0 ? failureTextOf(failure) : null;
const renameRefusal = computed(() =>
  lineOf(rename.failure.value, Object.keys(rename.fieldErrors.value).length),
);
const activationRefusal = computed(() => lineOf(activation.failure.value, 0));
const twoFactorRefusal = computed(() => lineOf(twoFactor.failure.value, 0));

function submitRename() {
  const name = newName.value.trim();
  if (name !== '' && name !== props.user.username) void rename.run(name);
}
</script>

<template>
  <section class="flex flex-col gap-4" :aria-label="$t('admin.users.edit.account.title')">
    <h3 class="font-display text-base font-semibold">{{ $t('admin.users.edit.account.title') }}</h3>
    <div v-if="canAccount" class="flex flex-col gap-2">
      <p class="text-sm">
        {{
          user.isActive
            ? $t('admin.users.edit.account.active')
            : user.banReason !== null
              ? $t('admin.users.edit.account.banned')
              : $t('admin.users.edit.account.inactive')
        }}
      </p>
      <button
        v-if="user.isActive"
        type="button"
        :class="ADMIN_DANGER_CLASS"
        class="self-start"
        @click="isDeactivateOpen = true"
      >
        {{ $t('admin.users.edit.account.deactivate') }}
      </button>
      <button
        v-else-if="user.banReason === null"
        type="button"
        :class="ADMIN_BUTTON_CLASS"
        class="self-start"
        :aria-busy="activation.isPending.value || undefined"
        @click="activation.run(true)"
      >
        {{ $t('admin.users.edit.account.activate') }}
      </button>
      <AdminStatus v-if="activationRefusal" kind="refused" :text="activationRefusal" />
      <ConfirmDialog
        v-model:visible="isDeactivateOpen"
        :title="$t('admin.users.edit.account.deactivateDialog.title', { username: user.username })"
        :body="$t('admin.users.edit.account.deactivateDialog.body')"
        :confirm-label="$t('admin.users.edit.account.deactivate')"
        tone="danger"
        :busy="activation.isPending.value"
        @confirm="activation.run(false)"
      />
    </div>
    <form v-if="canAccount" class="flex flex-col gap-3" @submit.prevent="submitRename">
      <AdminField
        v-slot="{ id, describedBy, invalid }"
        :label="$t('admin.users.edit.account.rename')"
        :hint="$t('admin.users.edit.account.renameHint')"
        :error="rename.fieldErrors.value.username"
        input-id="edit-username"
      >
        <input
          :id="id"
          v-model="newName"
          maxlength="30"
          autocomplete="off"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
        />
      </AdminField>
      <button
        type="submit"
        :class="ADMIN_BUTTON_CLASS"
        class="self-start"
        :aria-disabled="newName.trim() === user.username || rename.isPending.value || undefined"
      >
        {{ $t('admin.users.edit.account.renameSubmit') }}
      </button>
      <AdminStatus v-if="renameRefusal" kind="refused" :text="renameRefusal" />
    </form>
    <div v-if="canResetTwoFactor" class="flex flex-col gap-2">
      <p class="text-sm text-muted">{{ $t('admin.users.edit.account.twoFactorNote') }}</p>
      <button
        type="button"
        :class="ADMIN_BUTTON_CLASS"
        class="self-start"
        @click="isTwoFactorOpen = true"
      >
        {{ $t('admin.users.edit.account.twoFactor') }}
      </button>
      <AdminStatus v-if="twoFactorRefusal" kind="refused" :text="twoFactorRefusal" />
      <ConfirmDialog
        v-model:visible="isTwoFactorOpen"
        :title="$t('admin.users.edit.account.twoFactorDialog.title', { username: user.username })"
        :body="$t('admin.users.edit.account.twoFactorDialog.body')"
        :confirm-label="$t('admin.users.edit.account.twoFactor')"
        tone="danger"
        :busy="twoFactor.isPending.value"
        @confirm="twoFactor.run(undefined)"
      />
    </div>
    <AdminStatus
      v-if="twoFactor.isDone.value"
      kind="done"
      :text="$t('admin.users.edit.account.twoFactorDone')"
    />
  </section>
</template>
