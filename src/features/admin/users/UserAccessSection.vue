<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQueryClient } from '@tanstack/vue-query';
import type { UserAccess } from '@/api/types/users-admin';
import { changeUserAccess } from '@/api/users-admin.api';
import QueryState from '@/components/QueryState.vue';
import { failureTextOf } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import AdminStatus from '../ui/AdminStatus.vue';
import AdminSwitch from '../ui/AdminSwitch.vue';
import PermissionChecklist from './PermissionChecklist.vue';
import { accessChangeOf, accessFormOf, inheritedFrom } from './user-access';
import type { AccessForm } from './user-access';
import {
  invalidateUserModeration,
  usePermissionCatalogQuery,
  useRolesQuery,
  useUserAccessQuery,
} from './users.queries';

/** Roles, staff/superuser flags and direct permissions. Anyone who opens the dialog reads them; only a superuser (never on their own account) changes them. */
const props = defineProps<{ username: string }>();
const { t } = useI18n();
const FORM_ID = 'user-edit-access';
const accessQuery = useUserAccessQuery(() => props.username);
const rolesQuery = useRolesQuery();
const catalogQuery = usePermissionCatalogQuery();
const access = computed(() => accessQuery.data.value);
const roles = computed(() => rolesQuery.data.value ?? []);
const queryClient = useQueryClient();
/** The access the form started from: a refetch never wipes unsaved ticks, and the change sent is form minus this (the backend applies it on top of the stored access). */
const basis = ref<UserAccess | null>(null);
const form = ref<AccessForm | null>(null);
const seed = (loaded: UserAccess) => {
  basis.value = loaded;
  form.value = accessFormOf(loaded);
};
watch(
  access,
  (loaded) => {
    if (loaded && !basis.value) seed(loaded);
  },
  { immediate: true },
);
const canEdit = computed(() => basis.value?.canEdit === true);
const inherited = computed(() => inheritedFrom(roles.value, form.value?.groups ?? []));
const change = computed(() =>
  basis.value && form.value ? accessChangeOf(basis.value, form.value) : {},
);
const hasChanges = computed(() => Object.keys(change.value).length > 0);
const isPending = computed(
  () => accessQuery.isPending.value || rolesQuery.isPending.value || catalogQuery.isPending.value,
);
const loadError = computed(
  () => accessQuery.error.value ?? rolesQuery.error.value ?? catalogQuery.error.value,
);

const savedAt = ref<Date | null>(null);
const save = useAdminMutation({
  mutate: () => changeUserAccess(props.username, change.value),
  invalidates: () => [['admin', 'access']],
  successText: () => t('admin.users.access.saved'),
  onSuccess: (saved) => {
    seed(saved);
    savedAt.value = new Date();
  },
  // The flags also show in the staff list and on the opened user's card.
  onDone: () => {
    void invalidateUserModeration(queryClient, props.username);
  },
});
/** Issue texts (`group_unknown`, `permission_unknown`, …) when the backend names them, else the refusal. */
const refusal = computed(() => {
  const issues = Object.values(save.fieldErrors.value);
  if (issues.length) return issues.join(' ');
  return save.failure.value ? failureTextOf(save.failure.value) : null;
});
const toggleRole = (id: string) => {
  if (!form.value || !canEdit.value) return;
  const chosen = form.value.groups;
  form.value.groups = chosen.includes(id) ? chosen.filter((item) => item !== id) : [...chosen, id];
};
function discard() {
  if (basis.value) form.value = accessFormOf(basis.value);
  save.reset();
}
defineExpose({
  formId: FORM_ID,
  saveLabel: t('common.save'),
  editable: canEdit,
  dirtyCount: computed(() => (canEdit.value ? Object.keys(change.value).length : 0)),
  isPending: save.isPending,
  savedAt,
  discard,
});
const retry = () =>
  Promise.all([accessQuery.refetch(), rolesQuery.refetch(), catalogQuery.refetch()]);
</script>

<template>
  <section class="flex flex-col gap-4" :aria-label="$t('admin.users.access.title')">
    <QueryState :loading="isPending" :error="loadError" @retry="retry">
      <form
        v-if="basis && form"
        :id="FORM_ID"
        class="flex flex-col gap-4"
        data-testid="user-access"
        @submit.prevent="canEdit && hasChanges && save.run(undefined)"
      >
        <p v-if="!canEdit" class="text-sm text-muted" data-testid="access-read-only">
          {{ $t('admin.users.access.readOnly') }}
        </p>
        <AdminSwitch
          v-if="canEdit"
          v-model="form.isStaff"
          :label="$t('admin.users.access.isStaff')"
          :description="$t('admin.users.access.isStaffHint')"
        />
        <AdminSwitch
          v-if="canEdit"
          v-model="form.isSuperuser"
          :label="$t('admin.users.access.isSuperuser')"
          :description="$t('admin.users.access.isSuperuserHint')"
        />
        <p v-else class="text-sm">
          {{ $t(basis.isStaff ? 'admin.users.access.staffYes' : 'admin.users.access.staffNo') }}
          ·
          {{
            $t(
              basis.isSuperuser
                ? 'admin.users.access.superuserYes'
                : 'admin.users.access.superuserNo',
            )
          }}
        </p>
        <AdminStatus
          v-if="form.isSuperuser"
          kind="security"
          :text="$t('admin.users.access.superuserHoldsAll')"
        />
        <fieldset class="flex flex-col gap-2">
          <legend class="mb-1 text-sm font-semibold">{{ $t('admin.users.access.roles') }}</legend>
          <p v-if="roles.length === 0" class="text-sm text-muted">
            {{ $t('admin.users.access.noRoles') }}
          </p>
          <div class="flex flex-wrap gap-2">
            <template v-for="role in roles" :key="role.id">
              <button
                v-if="canEdit"
                type="button"
                :aria-pressed="form.groups.includes(role.id)"
                class="inline-flex min-h-11 items-center rounded-pill border border-line-strong px-4 text-sm font-semibold aria-pressed:bg-accent-soft aria-pressed:text-accent-soft-text"
                data-testid="role-chip"
                @click="toggleRole(role.id)"
              >
                {{ role.name }}
              </button>
              <span
                v-else-if="form.groups.includes(role.id)"
                class="inline-flex min-h-8 items-center rounded-pill bg-accent-soft px-3 text-sm text-accent-soft-text"
                data-testid="role-chip"
              >
                {{ role.name }}
              </span>
            </template>
            <span v-if="!canEdit && form.groups.length === 0" class="text-sm text-muted">
              {{ $t('admin.users.access.noRolesHeld') }}
            </span>
          </div>
        </fieldset>
        <div class="flex flex-col gap-2">
          <h4 class="text-sm font-semibold">{{ $t('admin.users.access.permissions') }}</h4>
          <p class="text-xs text-muted">{{ $t('admin.users.access.permissionsHint') }}</p>
          <PermissionChecklist
            v-model="form.permissions"
            :catalog="catalogQuery.data.value ?? []"
            :inherited="inherited"
            :readonly="!canEdit"
          />
        </div>
        <AdminStatus v-if="canEdit && refusal" kind="refused" :text="refusal" />
      </form>
    </QueryState>
  </section>
</template>
