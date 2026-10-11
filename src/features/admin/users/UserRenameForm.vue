<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQueryClient } from '@tanstack/vue-query';
import { renameUser } from '@/api/users-admin.api';
import { failureTextOf } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { BUTTON, INPUT } from '../ui/controls';

/** A new username (`auth.change_user`); the drawer moves to the new name. */
const props = defineProps<{ username: string }>();
const emit = defineEmits<{ renamed: [username: string] }>();
const { t } = useI18n();
const queryClient = useQueryClient();
const newName = ref(props.username);
const rename = useAdminMutation({
  mutate: (username: string) => renameUser(props.username, username),
  successText: (result) => t('admin.users.edit.account.renamed', { username: result.username }),
  // Marked stale without a refetch: the old name's edit query would 404 before the drawer switches to the new one.
  onDone: (result) => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'users'], refetchType: 'none' });
    void queryClient.invalidateQueries({ queryKey: ['users'], refetchType: 'none' });
    emit('renamed', result.username);
  },
});
const isUnchanged = computed(() => newName.value.trim() === props.username);
const refusal = computed(() =>
  rename.failure.value && Object.keys(rename.fieldErrors.value).length === 0
    ? failureTextOf(rename.failure.value)
    : null,
);
function submit() {
  const name = newName.value.trim();
  if (name !== '' && !isUnchanged.value) void rename.run(name);
}
</script>

<template>
  <form class="flex flex-col gap-3" @submit.prevent="submit">
    <AdminField
      v-slot="{ id, describedBy, invalid }"
      :label="$t('admin.users.edit.account.rename')"
      :hint="$t('admin.users.edit.account.renameHint')"
      :error="rename.fieldErrors.value.username"
      input-id="edit-username"
    >
      <div class="flex flex-wrap gap-2">
        <input
          :id="id"
          v-model="newName"
          maxlength="30"
          autocomplete="off"
          :class="[INPUT, 'min-w-0 flex-1 basis-48']"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
        />
        <button
          type="submit"
          :class="BUTTON.secondary"
          :aria-disabled="isUnchanged || rename.isPending.value || undefined"
          :aria-busy="rename.isPending.value || undefined"
        >
          {{ $t('admin.users.edit.account.renameSubmit') }}
        </button>
      </div>
    </AdminField>
    <AdminStatus v-if="refusal" kind="refused" :text="refusal" />
  </form>
</template>
