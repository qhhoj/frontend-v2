<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CopyButton from '@/components/CopyButton.vue';
import QueryState from '@/components/QueryState.vue';
import { formatDate } from '@/lib/format';
import { useUserPageQuery } from '@/features/users/users.queries';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { usePermissions } from '@/stores/use-permissions';
import AdminStatus from '../ui/AdminStatus.vue';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import ImpersonateDialog from './ImpersonateDialog.vue';
import UserEditDialog from './UserEditDialog.vue';
import UserModerationPanel from './UserModerationPanel.vue';
import { canImpersonate } from './users-list';
import { isNotFound } from '../ui/admin-errors';

const props = defineProps<{ username: string }>();
const locale = useLocaleStore();
const { can, isSuperuser } = usePermissions();
const query = useUserPageQuery(() => props.username);
const user = computed(() => query.data.value);
const isMissing = computed(() => isNotFound(query.error.value));
/** Moderation needs the backend permission and the staff facts it sends only to its holders. */
const canModerate = computed(() => can('judge.ban_user') && Boolean(user.value?.staff));
const showImpersonate = computed(
  () => user.value !== undefined && canImpersonate(isSuperuser.value, user.value),
);
const isImpersonateOpen = ref(false);
/** Editing needs `judge.change_profile`; a superuser is editable by superusers only (the backend refuses the rest). */
const session = useSessionStore();
/** Not yourself: your own account is edited in the settings, and the backend refuses it here. */
const canEdit = computed(
  () =>
    can('judge.change_profile') &&
    user.value !== undefined &&
    user.value.id !== session.user?.id &&
    (isSuperuser.value || user.value.staff?.isSuperuser !== true),
);
const isEditOpen = ref(false);
const route = useRoute();
const router = useRouter();
/** A rename moves the opened card to the new name (`?user=`); the card remounts under it. */
const openRenamed = (username: string) =>
  router.replace({ query: { ...route.query, user: username } });
</script>

<template>
  <section
    v-if="isMissing"
    class="glass rounded-panel p-5"
    :aria-label="$t('admin.users.card.label')"
  >
    <AdminStatus kind="refused" :text="$t('admin.users.card.notFound', { name: username })" />
  </section>
  <QueryState
    v-else
    :loading="query.isPending.value"
    :error="query.error.value"
    @retry="query.refetch()"
  >
    <section
      v-if="user"
      data-testid="user-card"
      class="glass flex flex-col gap-5 rounded-panel p-5"
      :aria-label="$t('admin.users.card.label')"
    >
      <header class="flex flex-col gap-1">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <AdminUserLabel
            :username="user.username"
            :rating="user.rating"
            :size="28"
            :link="false"
            :status="user.displayRank === 'banned' ? 'banned' : 'active'"
          />
          <button
            v-if="canEdit"
            type="button"
            :class="ADMIN_BUTTON_CLASS"
            data-testid="user-edit-open"
            @click="isEditOpen = true"
          >
            {{ $t('admin.users.edit.open') }}
          </button>
        </div>
        <p class="text-sm text-muted">
          {{
            $t('admin.users.card.joined', {
              name: user.displayName,
              date: formatDate(user.dateJoined, locale.locale),
            })
          }}
        </p>
      </header>
      <dl class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt class="text-muted">{{ $t('admin.users.card.facts.rank') }}</dt>
          <dd class="font-semibold">{{ user.displayRank }}</dd>
        </div>
        <div>
          <dt class="text-muted">{{ $t('admin.users.card.facts.rating') }}</dt>
          <dd class="font-semibold">{{ user.rating ?? $t('admin.users.card.none') }}</dd>
        </div>
        <div>
          <dt class="text-muted">{{ $t('admin.users.card.facts.solved') }}</dt>
          <dd class="font-semibold">{{ user.problemCount }}</dd>
        </div>
        <div>
          <dt class="text-muted">{{ $t('admin.users.card.facts.organization') }}</dt>
          <dd class="font-semibold">
            {{ user.organizations[0]?.name ?? $t('admin.users.card.none') }}
          </dd>
        </div>
      </dl>
      <div class="flex flex-col gap-2">
        <span class="text-sm text-muted">{{ $t('admin.users.card.facts.id') }}</span>
        <div class="flex flex-wrap items-center gap-3">
          <code class="break-all font-mono text-sm">{{ user.id }}</code>
          <CopyButton :text="user.id" :label="$t('admin.users.card.copyId')" />
        </div>
      </div>
      <UserEditDialog
        v-if="isEditOpen"
        v-model:visible="isEditOpen"
        :username="user.username"
        @renamed="openRenamed"
      />
      <UserModerationPanel v-if="canModerate" :key="user.username" :user="user" />
      <section v-if="showImpersonate" class="flex flex-col gap-2">
        <h2 class="text-base font-semibold">{{ $t('admin.users.impersonate.title') }}</h2>
        <p class="text-sm text-muted">{{ $t('admin.users.impersonate.note') }}</p>
        <button
          type="button"
          :class="ADMIN_BUTTON_CLASS"
          class="self-start"
          @click="isImpersonateOpen = true"
        >
          {{ $t('admin.users.impersonate.open', { username: user.username }) }}
        </button>
        <ImpersonateDialog
          v-model:visible="isImpersonateOpen"
          :username="user.username"
          :user-id="user.id"
        />
      </section>
    </section>
  </QueryState>
</template>
