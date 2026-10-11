<script setup lang="ts">
import { EllipsisVertical } from 'lucide-vue-next';
import Menu from 'primevue/menu';
import type { MenuItem } from 'primevue/menuitem';
import { computed, ref } from 'vue';
import { translate } from '@/i18n';
import type { OrganizationMember } from '@/api/types/organizations';
import { usePermissions } from '@/stores/use-permissions';
import AdminUserLabel from '../ui/AdminUserLabel.vue';

/**
 * One member in the administrators' list: rank, name, points, and a ⋮ menu of role and remove actions. An admin cannot be removed
 * (backend `admin_not_kickable`); the last admin cannot step down either (`canDemote` false).
 */
const props = defineProps<{ member: OrganizationMember; isAdmin: boolean; canDemote: boolean }>();
const emit = defineEmits<{ kick: []; promote: []; demote: [] }>();
const { can } = usePermissions();
/** The user admin page needs `judge.ban_user`; others get no link to a screen they cannot open. */
const canOpenUser = computed(() => can('judge.ban_user'));
const menu = ref<InstanceType<typeof Menu>>();
const isMenuOpen = ref(false);
/** The mock-up's ⋮ menu: an admin may step down; a member may be promoted or removed. */
const menuModel = computed<MenuItem[]>(() =>
  props.isAdmin
    ? [{ label: translate('orgAdmin.members.demote'), command: () => emit('demote') }]
    : [
        { label: translate('orgAdmin.members.promote'), command: () => emit('promote') },
        {
          label: translate('admin.organizations.members.kick'),
          class: 'text-negative',
          command: () => emit('kick'),
        },
      ],
);
</script>

<template>
  <li data-testid="member-row" class="flex flex-wrap items-center justify-between gap-3 py-2">
    <span class="flex min-w-0 items-center gap-3">
      <span class="w-8 text-sm text-muted">{{ member.rank }}</span>
      <AdminUserLabel :username="member.username" :rating="member.rating" />
      <span
        v-if="isAdmin"
        data-testid="admin-chip"
        class="rounded-pill bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-soft-text"
        >{{ $t('admin.organizations.members.admin') }}</span
      >
    </span>
    <span class="flex flex-wrap items-center gap-3">
      <span class="text-sm text-muted tabular-nums">{{ member.performancePoints }}</span>
      <RouterLink
        v-if="canOpenUser"
        :to="{ name: 'admin-users', query: { q: member.username } }"
        class="inline-flex min-h-11 items-center text-sm font-semibold text-accent-text hover:underline"
        :aria-label="$t('admin.organizations.members.openUserNamed', { username: member.username })"
      >
        {{ $t('admin.organizations.members.openUser') }}
      </RouterLink>
      <span v-if="isAdmin && !canDemote" class="max-w-48 text-xs text-muted">
        {{ $t('orgAdmin.members.lastAdmin') }}
      </span>
      <template v-else>
        <button
          type="button"
          data-testid="member-actions"
          class="inline-flex size-11 items-center justify-center rounded-pill text-muted hover:bg-surface-hover hover:text-content"
          :aria-label="$t('orgAdmin.members.actionsNamed', { username: member.username })"
          aria-haspopup="menu"
          :aria-expanded="isMenuOpen"
          @click="menu?.toggle($event)"
        >
          <EllipsisVertical aria-hidden="true" class="size-4" />
        </button>
        <Menu
          ref="menu"
          :model="menuModel"
          popup
          :pt="{
            root: {
              'aria-label': $t('orgAdmin.members.actionsNamed', { username: member.username }),
            },
          }"
          @show="isMenuOpen = true"
          @hide="isMenuOpen = false"
        />
      </template>
    </span>
  </li>
</template>
