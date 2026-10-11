<script setup lang="ts">
import type { NewUserRow } from '@/api/types/users-admin';
import AdminField from '../ui/AdminField.vue';
import { ADMIN_INPUT_CLASS } from '../ui/classes';

/** One new account: an empty password means a generated one, unless an invite is mailed. */
const row = defineModel<NewUserRow>({ required: true });
const set = (patch: Partial<NewUserRow>) => {
  row.value = { ...row.value, ...patch };
};
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2">
    <AdminField
      v-slot="{ id, describedBy }"
      :label="$t('admin.users.create.username')"
      input-id="create-username"
    >
      <input
        :id="id"
        :value="row.username"
        maxlength="30"
        autocomplete="off"
        :class="ADMIN_INPUT_CLASS"
        :aria-describedby="describedBy"
        @input="set({ username: ($event.target as HTMLInputElement).value })"
      />
    </AdminField>
    <AdminField
      v-slot="{ id }"
      :label="$t('admin.users.create.fullName')"
      input-id="create-full-name"
    >
      <input
        :id="id"
        :value="row.fullName ?? ''"
        maxlength="30"
        :class="ADMIN_INPUT_CLASS"
        @input="set({ fullName: ($event.target as HTMLInputElement).value || undefined })"
      />
    </AdminField>
    <AdminField v-slot="{ id }" :label="$t('admin.users.create.email')" input-id="create-email">
      <input
        :id="id"
        :value="row.email ?? ''"
        type="email"
        autocomplete="off"
        :class="ADMIN_INPUT_CLASS"
        @input="set({ email: ($event.target as HTMLInputElement).value || undefined })"
      />
    </AdminField>
    <AdminField
      v-slot="{ id, describedBy }"
      :label="$t('admin.users.create.password')"
      :hint="$t('admin.users.create.passwordHint')"
      input-id="create-password"
    >
      <input
        :id="id"
        :value="row.password ?? ''"
        type="password"
        autocomplete="new-password"
        :disabled="row.invite"
        :class="ADMIN_INPUT_CLASS"
        :aria-describedby="describedBy"
        @input="set({ password: ($event.target as HTMLInputElement).value || undefined })"
      />
    </AdminField>
    <label class="flex min-h-11 items-center gap-3 text-sm md:col-span-2">
      <input
        type="checkbox"
        class="size-5 accent-accent"
        :checked="row.invite === true"
        @change="
          set({
            invite: ($event.target as HTMLInputElement).checked || undefined,
            password: undefined,
          })
        "
      />
      {{ $t('admin.users.create.invite') }}
    </label>
  </div>
</template>
