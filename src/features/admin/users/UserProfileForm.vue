<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import type { UserEdit } from '@/api/types/users-admin';
import { updateUserByStaff } from '@/api/users-admin.api';
import { failureTextOf } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import AdminSwitch from '../ui/AdminSwitch.vue';
import OrganizationChips from '../ui/OrganizationChips.vue';
import { ADMIN_INPUT_CLASS, ADMIN_PRIMARY_CLASS } from '../ui/classes';
import { changedUserFields, STAFF_DISPLAY_RANKS, userEditFormOf } from './user-edit';
import { invalidateUserModeration } from './users.queries';

const props = defineProps<{ user: UserEdit; canEditEmail: boolean }>();
const queryClient = useQueryClient();
const form = ref(userEditFormOf(props.user));
const adminPassword = ref('');
const changes = computed(() => changedUserFields(props.user, form.value));
/** A new e-mail is a credential change: the backend wants the admin's own password with it. */
const isEmailChanged = computed(() => changes.value.email !== undefined);
const hasChanges = computed(() => Object.keys(changes.value).length > 0);

const save = useAdminMutation({
  mutate: () =>
    updateUserByStaff(
      props.user.username,
      isEmailChanged.value
        ? { ...changes.value, currentPassword: adminPassword.value }
        : changes.value,
    ),
  invalidates: () => [['admin', 'users']],
  onSuccess: () => {
    adminPassword.value = '';
  },
  onDone: () => {
    void invalidateUserModeration(queryClient, props.user.username);
  },
});
const errors = save.fieldErrors;
/** A refusal that names no field (a superuser target, a busy lock) is a line under the button. */
const refusal = computed(() =>
  save.failure.value && Object.keys(errors.value).length === 0
    ? failureTextOf(save.failure.value)
    : null,
);
</script>

<template>
  <form
    class="flex flex-col gap-4"
    :aria-label="$t('admin.users.edit.profile.title')"
    @submit.prevent="hasChanges && save.run(undefined)"
  >
    <h3 class="font-display text-base font-semibold">{{ $t('admin.users.edit.profile.title') }}</h3>
    <div class="grid gap-4 md:grid-cols-2">
      <AdminField
        v-slot="{ id, describedBy, invalid }"
        :label="$t('admin.users.edit.profile.displayName')"
        :hint="$t('admin.users.edit.profile.displayNameHint')"
        :error="errors.displayName"
        input-id="edit-display-name"
      >
        <input
          :id="id"
          v-model="form.displayName"
          maxlength="100"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
        />
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy, invalid }"
        :label="$t('admin.users.edit.profile.fullName')"
        :error="errors.fullName"
        input-id="edit-full-name"
      >
        <input
          :id="id"
          v-model="form.fullName"
          maxlength="30"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
        />
      </AdminField>
    </div>
    <AdminField
      v-slot="{ id, describedBy, invalid }"
      :label="$t('admin.users.edit.profile.email')"
      :hint="canEditEmail ? undefined : $t('admin.users.edit.profile.emailLocked')"
      :error="errors.email"
      input-id="edit-email"
    >
      <input
        :id="id"
        v-model="form.email"
        type="email"
        autocomplete="off"
        :readonly="!canEditEmail"
        :class="[ADMIN_INPUT_CLASS, !canEditEmail && 'text-muted']"
        :aria-describedby="describedBy"
        :aria-invalid="invalid === 'true'"
      />
    </AdminField>
    <AdminField
      v-if="isEmailChanged"
      v-slot="{ id, describedBy, invalid }"
      :label="$t('admin.users.edit.password.current')"
      :hint="$t('admin.users.edit.profile.emailPasswordHint')"
      :error="errors.currentPassword"
      input-id="edit-email-admin-password"
    >
      <input
        :id="id"
        v-model="adminPassword"
        type="password"
        autocomplete="current-password"
        :class="ADMIN_INPUT_CLASS"
        :aria-describedby="describedBy"
        :aria-invalid="invalid === 'true'"
      />
    </AdminField>
    <AdminField
      v-slot="{ id, describedBy, invalid }"
      :label="$t('admin.users.edit.profile.about')"
      :error="errors.about"
      input-id="edit-about"
    >
      <textarea
        :id="id"
        v-model="form.about"
        rows="5"
        :class="[ADMIN_INPUT_CLASS, 'py-2']"
        :aria-describedby="describedBy"
        :aria-invalid="invalid === 'true'"
      />
    </AdminField>
    <div class="grid gap-4 md:grid-cols-2">
      <AdminField
        v-slot="{ id, describedBy, invalid }"
        :label="$t('admin.users.edit.profile.displayRank')"
        :hint="$t('admin.users.edit.profile.displayRankHint')"
        :error="errors.displayRank"
        input-id="edit-display-rank"
      >
        <select
          :id="id"
          v-model="form.displayRank"
          :disabled="user.displayRank === 'banned'"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
        >
          <option v-if="user.displayRank === 'banned'" value="banned">banned</option>
          <option v-for="rank in STAFF_DISPLAY_RANKS" :key="rank" :value="rank">
            {{ $t(`admin.users.edit.ranks.${rank}`) }}
          </option>
        </select>
      </AdminField>
      <div class="flex flex-col gap-3">
        <AdminSwitch
          v-model="form.isUnlisted"
          :label="$t('admin.users.edit.profile.unlisted')"
          :description="$t('admin.users.edit.profile.unlistedHint')"
        />
        <AdminSwitch
          v-model="form.mute"
          :label="$t('admin.users.edit.profile.mute')"
          :description="$t('admin.users.edit.profile.muteHint')"
        />
        <AdminSwitch
          v-model="form.allowTagging"
          :label="$t('admin.users.edit.profile.allowTagging')"
        />
      </div>
    </div>
    <AdminField
      v-slot="{ id, describedBy, invalid }"
      :label="$t('admin.users.edit.profile.notes')"
      :hint="$t('admin.users.edit.profile.notesHint')"
      :error="errors.notes"
      input-id="edit-notes"
    >
      <textarea
        :id="id"
        v-model="form.notes"
        rows="3"
        maxlength="4096"
        :class="[ADMIN_INPUT_CLASS, 'py-2']"
        :aria-describedby="describedBy"
        :aria-invalid="invalid === 'true'"
      />
    </AdminField>
    <label v-if="user.inContest" class="flex min-h-11 items-center gap-3 text-sm">
      <input v-model="form.leaveCurrentContest" type="checkbox" class="size-5 accent-accent" />
      {{ $t('admin.users.edit.profile.leaveContest') }}
    </label>
    <OrganizationChips
      v-model="form.organizations"
      :label="$t('admin.users.edit.profile.organizations')"
      :error="errors.organizations"
    />
    <div class="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        :class="ADMIN_PRIMARY_CLASS"
        :aria-disabled="!hasChanges || save.isPending.value || undefined"
        :aria-busy="save.isPending.value || undefined"
      >
        {{ $t('admin.users.edit.profile.save') }}
      </button>
      <span v-if="!hasChanges" class="text-sm text-muted">{{
        $t('admin.users.edit.profile.noChanges')
      }}</span>
    </div>
    <AdminStatus
      v-if="save.isDone.value"
      kind="done"
      :text="$t('admin.users.edit.profile.saved')"
    />
    <AdminStatus v-if="refusal" kind="refused" :text="refusal" />
  </form>
</template>
