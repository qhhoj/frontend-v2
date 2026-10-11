<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef } from 'vue';
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
/** Set by the first submit: from then on the confirm field says at once whether the two copies match. */
const attempted = ref(false);
const inputs = {
  newPassword: useTemplateRef<HTMLInputElement>('newInput'),
  confirmation: useTemplateRef<HTMLInputElement>('confirmInput'),
  currentPassword: useTemplateRef<HTMLInputElement>('adminInput'),
};

const set = useAdminMutation({
  mutate: () =>
    setUserPassword(props.username, {
      newPassword: newPassword.value,
      currentPassword: currentPassword.value,
    }),
  onSuccess: () => {
    newPassword.value = confirmation.value = currentPassword.value = '';
    attempted.value = false;
  },
});
const errors = set.fieldErrors;
const isMismatch = computed(() => newPassword.value !== confirmation.value);
const confirmError = computed(() =>
  attempted.value && isMismatch.value ? t('admin.users.edit.password.mismatch') : undefined,
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

/** After a failed submit the first field in error takes focus, in form order. */
async function focusFirstInvalid(fields: (keyof typeof inputs)[]) {
  await nextTick();
  inputs[fields[0]!]?.value?.focus();
}

/** The two copies must match before anything is sent; the policy, breach check and the admin's own password are the server's. */
async function submit() {
  if (!isFilled.value || set.isPending.value) return;
  attempted.value = true;
  if (isMismatch.value) return void focusFirstInvalid(['confirmation']);
  await set.run(undefined);
  const invalid = (['newPassword', 'currentPassword'] as const).filter(
    (field) => errors.value[field],
  );
  if (invalid.length) void focusFirstInvalid(invalid);
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
          ref="newInput"
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
          ref="confirmInput"
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
        ref="adminInput"
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
      {{
        set.isPending.value
          ? $t('admin.users.edit.password.submitting')
          : $t('admin.users.edit.password.submit')
      }}
    </button>
    <AdminStatus
      v-if="set.isDone.value"
      kind="done"
      :text="$t('admin.users.edit.password.done', { username })"
    />
    <AdminStatus v-if="refusal" kind="refused" :text="refusal" />
  </form>
</template>
