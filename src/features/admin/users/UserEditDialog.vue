<script setup lang="ts">
import Dialog from 'primevue/dialog';
import { computed } from 'vue';
import QueryState from '@/components/QueryState.vue';
import { usePermissions } from '@/stores/use-permissions';
import UserAccountSection from './UserAccountSection.vue';
import UserPasswordForm from './UserPasswordForm.vue';
import UserProfileForm from './UserProfileForm.vue';
import UserResetLink from './UserResetLink.vue';
import { useUserEditQuery } from './users.queries';

/** Staff edit of one account: the profile (`judge.change_profile`), then the credentials (`auth.change_user`). Mount it only while open. */
const props = defineProps<{ username: string }>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ renamed: [username: string] }>();
const { can } = usePermissions();
const query = useUserEditQuery(() => props.username);
const user = computed(() => query.data.value);
const canCredentials = computed(() => can('auth.change_user'));
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :draggable="false"
    :style="{ width: '760px', maxWidth: 'calc(100vw - 2rem)' }"
    :close-button-props="{ 'aria-label': $t('common.close') }"
  >
    <template #header>
      <h2 class="font-display text-lg font-semibold">
        {{ $t('admin.users.edit.title', { username }) }}
      </h2>
    </template>
    <QueryState
      :loading="query.isPending.value"
      :error="query.error.value"
      @retry="query.refetch()"
    >
      <div v-if="user" class="flex flex-col gap-6" data-testid="user-edit">
        <UserProfileForm :key="user.id" :user="user" :can-edit-email="canCredentials" />
        <template v-if="canCredentials || (can('judge.ban_user') && user.hasTwoFactor)">
          <hr class="border-line" />
          <UserAccountSection :user="user" @renamed="(name) => emit('renamed', name)" />
        </template>
        <template v-if="canCredentials">
          <hr class="border-line" />
          <UserPasswordForm :username="user.username" />
          <hr class="border-line" />
          <UserResetLink :username="user.username" :email="user.email" />
        </template>
        <p v-else class="text-sm text-muted">{{ $t('admin.users.edit.credentialsLocked') }}</p>
      </div>
    </QueryState>
  </Dialog>
</template>
