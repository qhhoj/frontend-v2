<script setup lang="ts">
import { computed, ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import type { Judge } from '@/api/types/judges-admin';
import AdminBit from '../shell/AdminBit.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { buttonClass } from '../ui/controls';
import AdminNotice from '../ui/feedback/AdminNotice.vue';
import JudgeActionDialogs from './JudgeActionDialogs.vue';
import JudgeDrawer from './JudgeDrawer.vue';
import JudgeKeyDialog from './JudgeKeyDialog.vue';
import JudgeQueueCard from './JudgeQueueCard.vue';
import JudgeStats from './JudgeStats.vue';
import JudgesTable from './JudgesTable.vue';
import type { JudgeAction, JudgeDialog } from './judge-actions';
import { judgeStats, matchesJudge, sortJudges } from './judge-stats';
import type { JudgeListFilter } from './judge-stats';
import { useJudgeWrites } from './judges.mutations';
import { useJudgesQuery } from './judges.queries';
import { JUDGE_POLL_MS } from './queue.queries';

const { data, isPending, error, refetch } = useJudgesQuery({ pollMs: JUDGE_POLL_MS });
const judges = computed(() => data.value ?? []);
const stats = computed(() => judgeStats(judges.value));
const listFilter = ref<JudgeListFilter>({ status: null, search: '' });
const isFiltered = computed(
  () => listFilter.value.status !== null || listFilter.value.search !== '',
);
const shown = computed(() =>
  sortJudges(judges.value).filter((judge) => matchesJudge(judge, listFilter.value)),
);
const clearFilters = () => (listFilter.value = { status: null, search: '' });

/** The row writes that need no confirm: Tắt / Bật lại and Bỏ chặn. */
const writes = useJudgeWrites();
/**
 * The judge a menu pick is about. The drawer and the dialogs read its fresh copy from the polled list, and keep the picked one
 * once it has left the list (a delete), so a closing dialog does not lose its title.
 */
const picked = ref<Judge | null>(null);
const target = computed(
  () => judges.value.find((judge) => judge.name === picked.value?.name) ?? picked.value,
);
const openDialog = ref<JudgeDialog | null>(null);
const isDrawerOpen = ref(false);

function act(action: JudgeAction, judge: Judge) {
  picked.value = judge;
  if (action === 'details') isDrawerOpen.value = true;
  else if (action === 'unblock')
    void writes.patch.run({ name: judge.name, patch: { isBlocked: false } });
  else openDialog.value = action;
}
const toggleDisabled = (judge: Judge) =>
  writes.patch.run({ name: judge.name, patch: { isDisabled: !judge.isDisabled } });

/**
 * The key shown once after a rotation. It lives here, outside QueryState, so a failed refetch cannot unmount it; it is dropped on
 * close, on route leave, and with this page.
 */
const revealed = ref<{ judgeName: string; authKey: string } | null>(null);
onBeforeRouteLeave(() => {
  revealed.value = null;
});
</script>

<template>
  <div class="flex flex-col gap-5">
    <AdminPageHeader
      :title="$t('admin.shell.screens.judges')"
      :lead="$t('admin.judges.index.lead')"
    >
      <template #actions>
        <RouterLink :to="{ name: 'admin-judgeNew' }" :class="buttonClass('primary')">
          {{ $t('admin.judges.index.addButton') }}
        </RouterLink>
      </template>
    </AdminPageHeader>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <div class="flex flex-col gap-5">
          <SkeletonBlock data-skeleton-region="judge-stats" class="h-44 w-full sm:h-20" />
          <SkeletonBlock data-skeleton-region="judge-table" class="h-72 w-full" />
        </div>
      </template>
      <JudgeStats v-model:status="listFilter.status" :stats="stats" />
      <AdminStatus
        v-if="writes.patch.failure.value"
        kind="refused"
        :text="failureTextOf(writes.patch.failure.value)"
      />
      <JudgesTable
        v-model:search="listFilter.search"
        :judges="shown"
        :filtered="isFiltered"
        :is-busy="writes.patch.isPending.value"
        @toggle-disabled="toggleDisabled"
        @act="act"
        @clear-filters="clearFilters"
      >
        <template #empty>
          <div class="flex flex-col items-center gap-3 px-4 py-8 text-center">
            <AdminBit placement="empty" />
            <p>{{ $t('admin.judges.index.empty') }}</p>
            <RouterLink :to="{ name: 'admin-judgeNew' }" :class="buttonClass('secondary')">
              {{ $t('admin.judges.index.emptyAdd') }}
            </RouterLink>
          </div>
        </template>
      </JudgesTable>
      <JudgeQueueCard />
      <AdminNotice
        :title="$t('admin.judges.notes.rotate')"
        :summary="$t('admin.judges.notes.load')"
      />
    </QueryState>
    <JudgeDrawer v-model:visible="isDrawerOpen" :judge="target" />
    <JudgeActionDialogs
      v-model:open="openDialog"
      :judge="target"
      @rotated="(judgeName, authKey) => (revealed = { judgeName, authKey })"
    />
    <JudgeKeyDialog
      :visible="revealed !== null"
      :header="$t('admin.judges.key.rotatedTitle', { name: revealed?.judgeName ?? '' })"
      :auth-key="revealed?.authKey ?? ''"
      @close="revealed = null"
    />
  </div>
</template>
