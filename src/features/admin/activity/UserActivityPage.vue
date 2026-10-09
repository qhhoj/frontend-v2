<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { deleteAnonymousActivity } from '@/api/activity-admin.api';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import SettingsNotice from '@/features/account/settings/SettingsNotice.vue';
import { translate } from '@/i18n';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { ADMIN_DANGER_CLASS } from '../ui/classes';
import { useAdminMutation } from '../ui/use-admin-mutation';
import { ADMIN_BIT_KINDS } from '../shell/admin-bit';
import ActivityFilters from './ActivityFilters.vue';
import ActivityTable from './ActivityTable.vue';
import LiveVisitorsCard from './LiveVisitorsCard.vue';
import UserSummaryPanel from './UserSummaryPanel.vue';
import { activityFilterFromQuery, activityFilterQuery } from './activity';
import type { ActivityFilter } from './activity';

const route = useRoute();
const router = useRouter();
const filter = computed(() => activityFilterFromQuery(route.query));
const summaryUser = computed(() =>
  typeof route.query.summary === 'string' ? route.query.summary : '',
);
const crumbs = computed(() => [
  { label: translate('admin.activity.crumbs.users') },
  { label: translate('admin.activity.crumbs.activity') },
]);

/** The summary stays open across filter changes; the URL keeps it. */
const summaryQuery = () => (summaryUser.value ? { summary: summaryUser.value } : {});
function showFilter(next: ActivityFilter) {
  void router.replace({ query: { ...activityFilterQuery(next), ...summaryQuery() } });
}
function clearSummary() {
  void router.replace({ query: activityFilterQuery(filter.value) });
}

const isAnonymousConfirmOpen = ref(false);
const anonymousRemoval = useAdminMutation<void, void>({
  mutate: () => deleteAnonymousActivity(),
  invalidates: () => [['admin', 'activity'] as const],
  onDone: () => {
    isAnonymousConfirmOpen.value = false;
  },
});
</script>

<template>
  <AdminPageHeader
    :crumbs="crumbs"
    :title="$t('admin.activity.title')"
    :lead="$t('admin.activity.lead')"
  />
  <SettingsNotice tone="info" :bit="ADMIN_BIT_KINDS.security">
    {{ $t('admin.activity.note') }}
  </SettingsNotice>
  <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
    <div class="flex min-w-0 flex-col gap-6">
      <ActivityFilters :filter="filter" @change="showFilter" />
      <ActivityTable :filter="filter" />
      <div class="flex justify-end">
        <button type="button" :class="ADMIN_DANGER_CLASS" @click="isAnonymousConfirmOpen = true">
          {{ $t('admin.activity.anonymousDelete') }}
        </button>
      </div>
    </div>
    <aside class="flex min-w-0 flex-col gap-6">
      <LiveVisitorsCard />
      <UserSummaryPanel
        v-if="summaryUser"
        :key="summaryUser"
        :username="summaryUser"
        :days="filter.days"
        @deleted="clearSummary"
      />
    </aside>
  </div>
  <ConfirmDialog
    v-model:visible="isAnonymousConfirmOpen"
    :title="$t('admin.activity.confirm.anonymousTitle')"
    :body="$t('admin.activity.confirm.anonymousBody')"
    :confirm-label="$t('admin.activity.confirm.delete')"
    tone="danger"
    :busy="anonymousRemoval.isPending.value"
    @confirm="anonymousRemoval.run()"
  >
    <template #error>
      <AdminStatus
        v-if="anonymousRemoval.failure.value"
        kind="refused"
        :text="failureTextOf(anonymousRemoval.failure.value)"
      />
    </template>
  </ConfirmDialog>
</template>
