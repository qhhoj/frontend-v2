<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { setUserPassword } from '@/api/users-admin.api';
import SettingsNotice from '@/features/account/settings/SettingsNotice.vue';
import { failureTextOf } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { ADMIN_DANGER_CLASS, ADMIN_INPUT_CLASS } from '../ui/classes';

const props = defineProps<{ username: string }>();
const { t } = useI18n();
const newPassword = ref('');
const confirmation = ref('');
const currentPassword = ref('');
const mismatch = ref(false);

const set = useAdminMutation({
  mutate: () =>
    setUserPassword(props.username, {
      newPassword: newPassword.value,
      currentPassword: currentPassword.value,
    }),
  onSuccess: () => {
    newPassword.value = confirmation.value = currentPassword.value = '';
  },
});
const errors = set.fieldErrors;
const confirmError = computed(() =>
  mismatch.value ? t('admin.users.edit.password.mismatch') : undefined,
);
const isFilled = computed(() =>
  [newPassword, confirmation, currentPassword].every((field) => field.value !== ''),
);
/** A refusal that names no field (too many attempts, a concurrent change) is a line under the button. */
const refusal = computed(() =>
  set.failure.value && Object.keys(errors.value).length === 0
    ? failureTextOf(set.failure.value)
    : null,
);

/** The two copies must match before anything is sent; the admin's own password is checked by the server. */
function submit() {
  if (!isFilled.value) return;
  mismatch.value = newPassword.value !== confirmation.value;
  if (!mismatch.value) void set.run(undefined);
}
</script>

<template>
  <form
    class="flex flex-col gap-4"
    :aria-label="$t('admin.users.edit.password.title')"
    @submit.prevent="submit"
  >
    <h3 class="font-display text-base font-semibold">
      {{ $t('admin.users.edit.password.title') }}
    </h3>
    <SettingsNotice tone="warning">{{ $t('admin.users.edit.password.warning') }}</SettingsNotice>
    <div class="grid gap-4 md:grid-cols-2">
      <AdminField
        v-slot="{ id, describedBy, invalid }"
        :label="$t('admin.users.edit.password.new')"
        :hint="$t('admin.users.edit.password.newHint')"
        :error="errors.newPassword"
        input-id="edit-new-password"
      >
        <input
          :id="id"
          v-model="newPassword"
          type="password"
          autocomplete="new-password"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
        />
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy, invalid }"
        :label="$t('admin.users.edit.password.confirm')"
        :error="confirmError"
        input-id="edit-confirm-password"
      >
        <input
          :id="id"
          v-model="confirmation"
          type="password"
          autocomplete="new-password"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
        />
      </AdminField>
    </div>
    <AdminField
      v-slot="{ id, describedBy, invalid }"
      :label="$t('admin.users.edit.password.current')"
      :hint="$t('admin.users.edit.password.currentHint')"
      :error="errors.currentPassword"
      input-id="edit-admin-password"
    >
      <input
        :id="id"
        v-model="currentPassword"
        type="password"
        autocomplete="current-password"
        :class="ADMIN_INPUT_CLASS"
        :aria-describedby="describedBy"
        :aria-invalid="invalid === 'true'"
      />
    </AdminField>
    <button
      type="submit"
      :class="ADMIN_DANGER_CLASS"
      class="self-start"
      :aria-disabled="!isFilled || set.isPending.value || undefined"
      :aria-busy="set.isPending.value || undefined"
    >
      {{ $t('admin.users.edit.password.submit') }}
    </button>
    <AdminStatus
      v-if="set.isDone.value"
      kind="done"
      :text="$t('admin.users.edit.password.done', { username })"
    />
    <AdminStatus v-if="refusal" kind="refused" :text="refusal" />
  </form>
</template>
