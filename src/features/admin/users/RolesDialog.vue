<script setup lang="ts">
import Dialog from 'primevue/dialog';
import { computed, ref, useId } from 'vue';
import type { Role } from '@/api/types/users-admin';
import QueryState from '@/components/QueryState.vue';
import { usePermissions } from '@/stores/use-permissions';
import { BUTTON } from '../ui/controls';
import RoleEditor from './RoleEditor.vue';
import { usePermissionLabel } from './use-permission-label';
import { usePermissionCatalogQuery, useRolesQuery } from './users.queries';
import AdminChip from '../ui/AdminChip.vue';

/** Roles (legacy groups): everyone with the users screen reads them; a superuser creates and edits them. */
const visible = defineModel<boolean>('visible', { required: true });
const { isSuperuser } = usePermissions();
const rolesQuery = useRolesQuery();
const catalogQuery = usePermissionCatalogQuery();
const roles = computed(() => rolesQuery.data.value ?? []);
/** `new` while creating, a role while editing it, null while listing. */
const editing = ref<Role | 'new' | null>(null);
const opened = ref<string | null>(null);
const retry = () => Promise.all([rolesQuery.refetch(), catalogQuery.refetch()]);
const permissionLabel = usePermissionLabel();
const labelOf = (code: string) =>
  permissionLabel(code, catalogQuery.data.value?.find((entry) => entry.codename === code)?.label);
/** The custom header slot loses PrimeVue's own label, so the dialog is named by its heading here. */
const titleId = useId();
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :draggable="false"
    :style="{ width: '760px', maxWidth: 'calc(100vw - 2rem)' }"
    :close-button-props="{ 'aria-label': $t('common.close') }"
    :pt="{ root: { 'aria-labelledby': titleId } }"
  >
    <template #header>
      <h2 :id="titleId" class="font-display text-subtitle leading-7 font-semibold">
        {{ $t('admin.users.roles.title') }}
      </h2>
    </template>
    <QueryState
      :loading="rolesQuery.isPending.value || catalogQuery.isPending.value"
      :error="rolesQuery.error.value ?? catalogQuery.error.value"
      @retry="retry"
    >
      <RoleEditor
        v-if="editing"
        :key="editing === 'new' ? 'new' : editing.id"
        :role="editing === 'new' ? undefined : editing"
        :catalog="catalogQuery.data.value ?? []"
        @done="editing = null"
        @cancel="editing = null"
      />
      <div v-else class="flex flex-col gap-4" data-testid="roles-list">
        <p class="text-sm text-muted">
          {{ isSuperuser ? $t('admin.users.roles.lead') : $t('admin.users.roles.readOnly') }}
        </p>
        <button
          v-if="isSuperuser"
          type="button"
          :class="BUTTON.secondary"
          class="self-start"
          @click="editing = 'new'"
        >
          {{ $t('admin.users.roles.new') }}
        </button>
        <p v-if="roles.length === 0" class="text-sm text-muted">
          {{ $t('admin.users.access.noRoles') }}
        </p>
        <ul class="flex flex-col divide-y divide-line rounded-row border border-line">
          <li v-for="role in roles" :key="role.id" class="flex flex-col gap-2 p-3">
            <div class="flex flex-wrap items-center gap-3">
              <span class="font-semibold">{{ role.name }}</span>
              <span class="text-sm text-muted">
                {{
                  $t('admin.users.roles.counts', {
                    members: role.memberCount,
                    permissions: role.permissions.length,
                  })
                }}
              </span>
              <span class="ml-auto flex gap-2">
                <button
                  type="button"
                  :class="BUTTON.secondary"
                  :aria-expanded="opened === role.id"
                  @click="opened = opened === role.id ? null : role.id"
                >
                  {{ $t('admin.users.roles.show') }}
                </button>
                <button
                  v-if="isSuperuser"
                  type="button"
                  :class="BUTTON.secondary"
                  @click="editing = role"
                >
                  {{ $t('common.edit') }}
                </button>
              </span>
            </div>
            <ul v-if="opened === role.id" class="flex flex-wrap gap-1">
              <li v-for="code in role.permissions" :key="code">
                <AdminChip tone="accent">{{ labelOf(code) }}</AdminChip>
              </li>
              <li v-if="role.permissions.length === 0" class="text-sm text-muted">
                {{ $t('admin.users.access.noneHeld') }}
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </QueryState>
  </Dialog>
</template>
