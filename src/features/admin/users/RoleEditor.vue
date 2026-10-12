<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PermissionEntry, Role } from '@/api/types/users-admin';
import { createRole, updateRole } from '@/api/users-admin.api';
import { failureTextOf } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { BUTTON, INPUT } from '../ui/controls';
import AdminSaveBar from '../ui/form/AdminSaveBar.vue';
import PermissionChecklist from './PermissionChecklist.vue';
import { setDelta } from './user-access';

/** Create a role (no `role`) or edit one: its name and permissions. Superuser only. */
const props = defineProps<{ role?: Role; catalog: readonly PermissionEntry[] }>();
const emit = defineEmits<{ done: []; cancel: [] }>();
const name = ref(props.role?.name ?? '');
const permissions = ref<string[]>([...(props.role?.permissions ?? [])]);
/** Backend `OrganizationMembersRepository.grantGroup` finds this role by name (docs/decisions.md, roles). */
const ORG_ADMIN_ROLE = 'Org Admin';
const NO_INHERITED = new Map<string, string[]>();
const delta = computed(() => setDelta(props.role?.permissions ?? [], permissions.value));
const isNameChanged = computed(() => name.value.trim() !== (props.role?.name ?? '').trim());
const isPermissionsChanged = computed(
  () => delta.value.add.length > 0 || delta.value.remove.length > 0,
);
const dirtyCount = computed(() => Number(isNameChanged.value) + Number(isPermissionsChanged.value));
function discard() {
  name.value = props.role?.name ?? '';
  permissions.value = [...(props.role?.permissions ?? [])];
}

const save = useAdminMutation({
  mutate: () =>
    props.role
      ? updateRole(props.role.id, {
          ...(isNameChanged.value ? { name: name.value.trim() } : {}),
          ...(delta.value.add.length ? { addPermissions: delta.value.add } : {}),
          ...(delta.value.remove.length ? { removePermissions: delta.value.remove } : {}),
        })
      : createRole({ name: name.value.trim(), permissions: permissions.value }),
  invalidates: () => [['admin', 'access']],
  onDone: () => emit('done'),
});
const errors = save.fieldErrors;
/** A refusal that names no field shown above (a lock, a permission-list limit) is a line under the buttons. */
const refusal = computed(() => {
  const { name: _name, permissions: _permissions, ...rest } = errors.value;
  const others = Object.values(rest);
  if (others.length) return others.join(' ');
  return save.failure.value && !_name && !_permissions ? failureTextOf(save.failure.value) : null;
});
</script>

<template>
  <form
    class="flex flex-col gap-4"
    data-testid="role-editor"
    @submit.prevent="dirtyCount > 0 && name.trim() !== '' && save.run(undefined)"
  >
    <AdminField
      v-slot="{ id, describedBy, invalid }"
      :label="$t('admin.users.roles.name')"
      :error="errors.name"
      input-id="role-name"
    >
      <input
        :id="id"
        v-model="name"
        maxlength="150"
        :class="INPUT"
        :aria-describedby="describedBy"
        :aria-invalid="invalid === 'true'"
      />
    </AdminField>
    <AdminStatus
      v-if="role?.name.trim() === ORG_ADMIN_ROLE"
      kind="security"
      :text="$t('admin.users.roles.orgAdminNote')"
    />
    <PermissionChecklist v-model="permissions" :catalog="catalog" :inherited="NO_INHERITED" />
    <p v-if="errors.permissions" class="text-sm text-negative">{{ errors.permissions }}</p>
    <AdminSaveBar
      variant="footer"
      :dirty-count="dirtyCount"
      :pending="save.isPending.value"
      :blocked-reason="name.trim() === '' ? $t('admin.users.roles.nameRequired') : undefined"
      :save-label="role ? $t('admin.users.roles.save') : $t('admin.users.roles.create')"
      @discard="discard"
    >
      <template #actions>
        <button type="button" :class="BUTTON.secondary" @click="emit('cancel')">
          {{ $t('common.cancel') }}
        </button>
      </template>
    </AdminSaveBar>
    <AdminStatus v-if="refusal" kind="refused" :text="refusal" />
  </form>
</template>
