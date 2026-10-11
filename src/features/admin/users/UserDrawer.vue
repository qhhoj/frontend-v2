<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import { formatDate } from '@/lib/format';
import { useUserPageQuery } from '@/features/users/users.queries';
import { useLocaleStore } from '@/stores/locale.store';
import AdminDrawer from '../ui/AdminDrawer.vue';
import AdminTabs from '../ui/AdminTabs.vue';
import { isNotFound } from '../ui/admin-errors';
import AdminNotice from '../ui/feedback/AdminNotice.vue';
import AdminLeaveDialog from '../ui/form/AdminLeaveDialog.vue';
import AdminLeaveGuard from '../ui/form/AdminLeaveGuard.vue';
import UserAccessSection from './UserAccessSection.vue';
import UserAccountPanel from './UserAccountPanel.vue';
import UserDrawerChips from './UserDrawerChips.vue';
import UserDrawerSaveBar from './UserDrawerSaveBar.vue';
import UserProfileForm from './UserProfileForm.vue';
import UserSecurityPanel from './UserSecurityPanel.vue';
import { useDrawerCloseGuard } from './use-drawer-close-guard';
import { useUserDrawerAccess } from './use-user-drawer-access';
import { userSectionOf } from './users-list';
import { useUserEditQuery } from './users.queries';

/**
 * The staff editor of one account (pages/admin.md, "Users and the edit drawer"), open while `?user=` names it. Tabs Hồ sơ,
 * Quyền, Bảo mật and Tài khoản (`?section=`) stay mounted, so a draft survives a tab switch; the footer saves the open tab.
 */
const props = defineProps<{ username: string }>();
const route = useRoute();
const router = useRouter();
const locale = useLocaleStore();
const pageQuery = useUserPageQuery(() => props.username);
const page = computed(() => pageQuery.data.value);
const access = useUserDrawerAccess(page);
const editQuery = useUserEditQuery(() => props.username, access.canEdit);
const user = computed(() => editQuery.data.value);
/** Latched, so a 2FA reset's confirmation stays on screen after the refetch clears the flag. */
const hadTwoFactor = ref(false);
watch(
  () => user.value?.hasTwoFactor,
  (has) => {
    if (has) hadTwoFactor.value = true;
  },
  { immediate: true },
);
const sections = computed(() => access.sectionsOf(hadTwoFactor.value));
const current = computed(() => {
  const asked = userSectionOf(route.query);
  return asked && sections.value.includes(asked) ? asked : sections.value[0];
});
const tabs = computed(() =>
  sections.value.map((key) => ({
    key,
    labelKey: `admin.users.edit.sections.${key}`,
    to: { query: { ...route.query, section: key } },
  })),
);

const profileForm = useTemplateRef<InstanceType<typeof UserProfileForm>>('profileForm');
const accessForm = useTemplateRef<InstanceType<typeof UserAccessSection>>('accessForm');
const savable = computed(() => {
  if (current.value === 'profile') return profileForm.value ?? null;
  if (current.value === 'access' && accessForm.value?.editable) return accessForm.value;
  return null;
});
const dirtyCount = computed(
  () => (profileForm.value?.dirtyCount ?? 0) + (accessForm.value?.dirtyCount ?? 0),
);

const isVisible = ref(true);
const guard = useDrawerCloseGuard(
  () => props.username,
  dirtyCount,
  () => {
    isVisible.value = false;
  },
);
/** After the slide-out: the list's URL without the drawer keys. */
function afterHide() {
  const query = Object.fromEntries(
    Object.entries(route.query).filter(([key]) => key !== 'user' && key !== 'section'),
  );
  void router.replace({ query });
}
const subtitle = computed(() => {
  const loaded = page.value;
  if (!loaded) return undefined;
  const joined = formatDate(loaded.dateJoined, locale.locale);
  return loaded.displayName === loaded.username ? joined : `${loaded.displayName} · ${joined}`;
});
const retry = () => Promise.all([pageQuery.refetch(), editQuery.refetch()]);
const openRenamed = (username: string) =>
  router.replace({ query: { ...route.query, user: username } });
</script>

<template>
  <AdminDrawer
    :visible="isVisible"
    :title="username"
    :subtitle="subtitle"
    @update:visible="(open) => !open && guard.requestClose()"
    @hide="afterHide"
  >
    <template v-if="page" #meta>
      <UserDrawerChips :page="page" :edit="user" />
    </template>
    <template v-if="tabs.length > 1" #tabs>
      <AdminTabs :tabs="tabs" :current="current" :label="$t('admin.users.edit.sectionsLabel')" />
    </template>
    <AdminNotice
      v-if="isNotFound(pageQuery.error.value)"
      tone="caution"
      :title="$t('admin.users.card.notFound', { name: username })"
    />
    <QueryState
      v-else
      :loading="pageQuery.isPending.value || (access.canEdit.value && editQuery.isPending.value)"
      :error="pageQuery.error.value ?? editQuery.error.value"
      @retry="retry"
    >
      <AdminNotice
        v-if="access.lock.value"
        tone="info"
        data-testid="user-edit-locked"
        :title="$t(`admin.users.edit.locked.${access.lock.value}`)"
      />
      <div v-else-if="page" class="flex flex-col" data-testid="user-edit">
        <UserProfileForm
          v-if="user"
          v-show="current === 'profile'"
          ref="profileForm"
          :user="user"
          :can-edit-email="access.canCredentials.value"
        />
        <UserAccessSection
          v-if="user"
          v-show="current === 'access'"
          ref="accessForm"
          :username="user.username"
        />
        <UserSecurityPanel
          v-if="user && sections.includes('security')"
          v-show="current === 'security'"
          :user="user"
          :had-two-factor="hadTwoFactor"
        />
        <UserAccountPanel
          v-if="sections.includes('account')"
          v-show="current === 'account'"
          :page="page"
          :edit="user"
          @renamed="openRenamed"
        />
      </div>
    </QueryState>
    <template v-if="savable" #footer>
      <UserDrawerSaveBar :form="savable" />
    </template>
  </AdminDrawer>
  <AdminLeaveDialog
    v-model:visible="guard.isLeaveOpen.value"
    :count="dirtyCount"
    @leave="guard.leaveAnyway"
  />
  <AdminLeaveGuard :dirty-count="dirtyCount" />
</template>
