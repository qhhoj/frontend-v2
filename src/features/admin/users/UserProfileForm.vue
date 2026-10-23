<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQueryClient } from '@tanstack/vue-query';
import type { UserEdit } from '@/api/types/users-admin';
import { updateUserByStaff } from '@/api/users-admin.api';
import { failureTextOf } from '../ui/admin-errors';
import type { FieldErrors } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import AdminSwitch from '../ui/AdminSwitch.vue';
import OrganizationChips from '../ui/OrganizationChips.vue';
import { INPUT } from '../ui/controls';
import { useDirtyForm } from '../ui/form/dirty-form';
import { needsPermissionText } from '../ui/permission-text';
import { changedUserFields, STAFF_DISPLAY_RANKS, userEditFormOf } from './user-edit';
import { displayRankLabel } from './display-rank';
import { invalidateUserModeration } from './users.queries';

/** The Hồ sơ tab. The drawer footer saves it (`form` id, exposed state); only changed fields are sent. */
const props = defineProps<{ user: UserEdit; canEditEmail: boolean }>();
const { t } = useI18n();
const queryClient = useQueryClient();
const FORM_ID = 'user-edit-profile';
/** The stored row the draft is compared with: the loaded user, then each saved answer. */
const basis = ref(props.user);
const { draft: form, discard, commit } = useDirtyForm(userEditFormOf(props.user));
const adminPassword = ref('');
const savedAt = ref<Date | null>(null);
const changes = computed(() => changedUserFields(basis.value, form.value));
/** A new e-mail is a credential change: the backend wants the admin's own password with it. */
const isEmailChanged = computed(() => changes.value.email !== undefined);
const dirtyCount = computed(() => Object.keys(changes.value).length);

const save = useAdminMutation({
  mutate: () =>
    updateUserByStaff(
      props.user.username,
      isEmailChanged.value
        ? { ...changes.value, currentPassword: adminPassword.value }
        : changes.value,
    ),
  successText: () => t('admin.users.edit.profile.saved'),
  // Re-seeded from the stored row: the backend normalises the e-mail, and `leaveCurrentContest` is a one-off action.
  onSuccess: (saved) => {
    basis.value = saved;
    commit(userEditFormOf(saved));
    adminPassword.value = '';
    savedAt.value = new Date();
  },
  // Also invalidates ['admin','users'], which holds the edit query.
  onDone: () => {
    void invalidateUserModeration(queryClient, props.user.username);
  },
});
/** Set by `submit` when the admin's own password is missing: the round trip would only answer "too short". */
const missingPassword = ref(false);
const errors = computed<FieldErrors>(() => ({
  ...(missingPassword.value ? { currentPassword: t('admin.ui.issues.password_required') } : {}),
  ...save.fieldErrors.value,
}));
/** A refusal that names no field (a superuser target, a busy lock) is a line above the footer. */
const refusal = computed(() =>
  save.failure.value && Object.keys(errors.value).length === 0
    ? failureTextOf(save.failure.value)
    : null,
);
function submit() {
  missingPassword.value = isEmailChanged.value && adminPassword.value === '';
  if (dirtyCount.value > 0 && !missingPassword.value) void save.run(undefined);
}
function discardAll() {
  discard();
  adminPassword.value = '';
  missingPassword.value = false;
  save.reset();
}
defineExpose({
  formId: FORM_ID,
  saveLabel: t('admin.users.edit.profile.save'),
  dirtyCount,
  isPending: save.isPending,
  savedAt,
  discard: discardAll,
});
</script>

<template>
  <form
    :id="FORM_ID"
    class="flex flex-col gap-4"
    :aria-label="$t('admin.users.edit.profile.title')"
    @submit.prevent="submit"
  >
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
          :class="INPUT"
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
          :class="INPUT"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
        />
      </AdminField>
    </div>
    <AdminField
      v-slot="{ id, describedBy, invalid }"
      :label="$t('admin.users.edit.profile.email')"
      :hint="canEditEmail ? undefined : needsPermissionText('auth.change_user')"
      :error="errors.email"
      input-id="edit-email"
    >
      <input
        :id="id"
        v-model="form.email"
        type="email"
        autocomplete="off"
        :readonly="!canEditEmail"
        :class="[INPUT, !canEditEmail && 'text-muted']"
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
        :class="INPUT"
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
        :class="[INPUT, 'py-2']"
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
          :class="INPUT"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
        >
          <option v-if="user.displayRank === 'banned'" value="banned">
            {{ displayRankLabel('banned') }}
          </option>
          <option v-for="rank in STAFF_DISPLAY_RANKS" :key="rank" :value="rank">
            {{ displayRankLabel(rank) }}
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
        :class="[INPUT, 'py-2']"
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
    <AdminStatus v-if="refusal" kind="refused" :text="refusal" />
  </form>
</template>
