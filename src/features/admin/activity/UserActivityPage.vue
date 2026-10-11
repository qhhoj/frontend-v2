<script setup lang="ts">
import { Download, Trash2 } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { activityExportUrl, deleteAnonymousActivity } from '@/api/activity-admin.api';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { translate } from '@/i18n';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { buttonClass } from '../ui/controls';
import AdminNotice from '../ui/feedback/AdminNotice.vue';
import { useAdminMutation } from '../ui/use-admin-mutation';
import ActivityFilters from './ActivityFilters.vue';
import ActivityTable from './ActivityTable.vue';
import LiveVisitorsCard from './LiveVisitorsCard.vue';
import UserSummaryPanel from './UserSummaryPanel.vue';
import { activityFilterFromQuery, activityFilterQuery, toActivityRequest } from './activity';
import type { ActivityFilter } from './activity';

const route = useRoute();
const router = useRouter();
const filter = computed(() => activityFilterFromQuery(route.query));
const summaryUser = computed(() =>
  typeof route.query.summary === 'string' ? route.query.summary : '',
);
const exportUrl = computed(() => activityExportUrl(toActivityRequest(filter.value)));

/** The summary stays open across filter changes; the URL keeps it. */
const summaryQuery = () => (summaryUser.value ? { summary: summaryUser.value } : {});
function showFilter(next: ActivityFilter) {
  void router.replace({ query: { ...activityFilterQuery(next), ...summaryQuery() } });
}
const clearFilters = () => showFilter({ ...filter.value, user: '', ip: '', path: '' });
function clearSummary() {
  void router.replace({ query: activityFilterQuery(filter.value) });
}

const isAnonymousConfirmOpen = ref(false);
function askAnonymousDelete(close: () => void) {
  close();
  anonymousRemoval.reset();
  isAnonymousConfirmOpen.value = true;
}
const anonymousRemoval = useAdminMutation<void, void>({
  mutate: () => deleteAnonymousActivity(),
  invalidates: () => [['admin', 'activity'] as const],
  successText: () => translate('admin.activity.toast.anonymousDeleted'),
  onDone: () => {
    isAnonymousConfirmOpen.value = false;
  },
});
const MENU_ITEM =
  'flex min-h-10 w-full items-center gap-3 rounded-cell px-3 text-left text-sm text-negative hover:bg-surface-hover pointer-coarse:min-h-11';
</script>

<template>
  <div class="flex flex-col gap-5">
    <AdminPageHeader :title="$t('admin.activity.title')" :lead="$t('admin.activity.lead')">
      <template #actions>
        <a :href="exportUrl" download :class="buttonClass('secondary')">
          <Download aria-hidden="true" class="size-4" :stroke-width="1.75" />
          {{ $t('admin.activity.filters.export') }}
        </a>
      </template>
      <template #overflow="{ close }">
        <button type="button" :class="MENU_ITEM" @click="askAnonymousDelete(close)">
          <Trash2 aria-hidden="true" class="size-4 shrink-0" :stroke-width="1.75" />
          {{ $t('admin.activity.anonymousDelete') }}
        </button>
      </template>
    </AdminPageHeader>
    <AdminNotice
      tone="info"
      :title="$t('admin.activity.notice.title')"
      :summary="$t('admin.activity.notice.summary')"
    >
      <p class="m-0">{{ $t('admin.activity.note') }}</p>
    </AdminNotice>
    <div class="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div class="flex min-w-0 flex-col gap-3">
        <ActivityFilters :filter="filter" @change="showFilter" />
        <ActivityTable :filter="filter" @clear-filters="clearFilters" />
      </div>
      <aside class="flex min-w-0 flex-col gap-5">
        <UserSummaryPanel
          v-if="summaryUser"
          :key="summaryUser"
          :username="summaryUser"
          :days="filter.days"
          @deleted="clearSummary"
          @close="clearSummary"
        />
        <LiveVisitorsCard />
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
  </div>
</template>
