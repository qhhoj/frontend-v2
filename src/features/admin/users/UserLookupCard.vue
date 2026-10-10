<script setup lang="ts">
import { computed, ref } from 'vue';
import CopyButton from '@/components/CopyButton.vue';
import QueryState from '@/components/QueryState.vue';
import { formatDate } from '@/lib/format';
import { useUserPageQuery } from '@/features/users/users.queries';
import { useLocaleStore } from '@/stores/locale.store';
import { usePermissions } from '@/stores/use-permissions';
import AdminStatus from '../ui/AdminStatus.vue';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import ImpersonateDialog from './ImpersonateDialog.vue';
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
        <AdminUserLabel
          :username="user.username"
          :rating="user.rating"
          :size="28"
          :link="false"
          :status="user.displayRank === 'banned' ? 'banned' : 'active'"
        />
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
