<script setup lang="ts">
import { computed } from 'vue';
import type { OrganizationMember } from '@/api/types/organizations';
import { usePermissions } from '@/stores/use-permissions';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { ADMIN_DANGER_CLASS } from '../ui/classes';

/** One member in the administrators' list: rank, name, points, and the remove button (admins get a chip instead). */
defineProps<{ member: OrganizationMember; isAdmin: boolean }>();
const emit = defineEmits<{ kick: [] }>();
const { can } = usePermissions();
/** The user admin page needs `judge.ban_user`; others get no link to a screen they cannot open. */
const canOpenUser = computed(() => can('judge.ban_user'));
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
      <span v-if="isAdmin" class="max-w-48 text-xs text-muted">
        {{ $t('admin.organizations.members.adminHint') }}
      </span>
      <button
        v-else
        type="button"
        :class="ADMIN_DANGER_CLASS"
        :aria-label="$t('admin.organizations.members.kickNamed', { username: member.username })"
        @click="emit('kick')"
      >
        {{ $t('admin.organizations.members.kick') }}
      </button>
    </span>
  </li>
</template>
