<script setup lang="ts">
import BulkSelectionBar from '../../ui/BulkSelectionBar.vue';
import { computed, ref, watch } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { useRoute, useRouter } from 'vue-router';
import { fetchParticipations, PARTICIPATIONS_PAGE_SIZE } from '@/api/contest-editing.api';
import type { BulkDisqualifyResult, EditableContest } from '@/api/types/contest-editing';
import EmptyState from '@/components/EmptyState.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useViewerId } from '@/stores/use-viewer-id';
import { ADMIN_BUTTON_CLASS, ADMIN_DANGER_CLASS, ADMIN_PRIMARY_CLASS } from '../../ui/classes';
import { checked, useRowSelection } from '../../ui/use-row-selection';
import ContestBulkResult from '../ContestBulkResult.vue';
import AddParticipationDialog from './AddParticipationDialog.vue';
import BulkDisqualifyDialog from './BulkDisqualifyDialog.vue';
import ParticipantRow from './ParticipantRow.vue';
import ParticipantsFilters from './ParticipantsFilters.vue';
import { participationQueryOf } from './participant-filters';

const props = defineProps<{ contest: EditableContest }>();
const route = useRoute();
const router = useRouter();
const viewer = useViewerId();
const locale = useLocaleStore();
const isAddOpen = ref(false);
const expandedId = ref<string | null>(null);
const query = computed(() => participationQueryOf(route.query));

const { data, error, isPending, refetch } = useQuery({
  queryKey: computed(() => [
    'admin',
    'participations',
    props.contest.key,
    viewer.value,
    query.value,
  ]),
  queryFn: () => fetchParticipations(props.contest.key, query.value),
});
const rows = computed(() => data.value?.items ?? []);
const total = computed(() => data.value?.meta.total ?? 0);
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / PARTICIPATIONS_PAGE_SIZE)));
const goToPage = (target: number) =>
  router.push({ query: { ...route.query, page: String(target) } });
const toggle = (id: string) => (expandedId.value = expandedId.value === id ? null : id);

/** A selection belongs to its page and filters: any change of either clears it, and the last result with it. */
const selection = useRowSelection(computed(() => rows.value.map((row) => row.id)));
const lastResult = ref<BulkDisqualifyResult | null>(null);
watch(query, () => {
  selection.clear();
  lastResult.value = null;
});
const isBulkOpen = ref(false);
const isBulkDisqualify = ref(true);
const openBulk = (disqualified: boolean) => {
  isBulkDisqualify.value = disqualified;
  isBulkOpen.value = true;
};
const usernameOf = (id: string) => rows.value.find((row) => row.id === id)?.user.username ?? id;
const selectedNames = computed(() => selection.selected.value.map(usernameOf));
const resultRows = computed(() =>
  (lastResult.value?.results ?? []).map((item) => ({ ...item, name: usernameOf(item.id) })),
);
function onBulkDone(result: BulkDisqualifyResult) {
  lastResult.value = result;
  selection.clear();
}
/** After an add, the list shows every row of that user, whatever kind or status was filtered. */
const showUser = (username: string) =>
  router.replace({
    query: {
      ...route.query,
      user: username,
      search: undefined,
      kind: undefined,
      status: undefined,
      page: undefined,
    },
  });
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <ParticipantsFilters />
      <button type="button" :class="ADMIN_PRIMARY_CLASS" @click="isAddOpen = true">
        {{ $t('admin.contestOps.participants.add') }}
      </button>
    </div>
    <p class="text-sm text-muted" aria-live="polite">
      {{
        $t('admin.contests.participants.countLine', { total: formatNumber(total, locale.locale) })
      }}
    </p>

    <BulkSelectionBar :count="selection.selected.value.length" @clear="selection.clear">
      <button type="button" :class="ADMIN_DANGER_CLASS" @click="openBulk(true)">
        {{ $t('admin.contests.participants.bulk.disqualify') }}
      </button>
      <button type="button" :class="ADMIN_BUTTON_CLASS" @click="openBulk(false)">
        {{ $t('admin.contests.participants.bulk.reinstate') }}
      </button>
    </BulkSelectionBar>
    <ContestBulkResult
      v-if="lastResult"
      :results="resultRows"
      reason-prefix="admin.contests.bulk.reasons"
    />

    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <div class="flex flex-col gap-3">
          <SkeletonBlock class="h-10 w-full" />
          <SkeletonBlock class="h-10 w-full" />
          <SkeletonBlock class="h-10 w-full" />
        </div>
      </template>
      <EmptyState v-if="rows.length === 0">{{
        $t('admin.contests.participants.empty')
      }}</EmptyState>
      <template v-else>
        <div class="glass overflow-x-auto rounded-panel p-3">
          <table class="w-full text-sm">
            <thead class="text-left text-muted">
              <tr>
                <th scope="col" class="w-9 py-2 pr-1 sm:w-11 sm:px-2">
                  <input
                    type="checkbox"
                    class="size-5"
                    :checked="selection.isAllSelected.value"
                    :indeterminate="selection.isSomeSelected.value"
                    :aria-label="$t('admin.contests.bulk.selectPage')"
                    @change="selection.toggleAll(checked($event))"
                  />
                </th>
                <th scope="col" class="px-2 py-2">
                  {{ $t('admin.contests.participants.columns.user') }}
                </th>
                <th scope="col" class="hidden px-2 py-2 md:table-cell">
                  {{ $t('admin.contests.participants.columns.kind') }}
                </th>
                <th scope="col" class="hidden px-2 py-2 text-right md:table-cell">
                  {{ $t('admin.contests.participants.columns.score') }}
                </th>
                <th scope="col" class="hidden px-2 py-2 text-right md:table-cell">
                  {{ $t('admin.contests.participants.columns.penalty') }}
                </th>
                <th scope="col" class="hidden px-2 py-2 text-right lg:table-cell">
                  {{ $t('admin.contestOps.participants.tiebreaker') }}
                </th>
                <th scope="col" class="hidden px-2 py-2 lg:table-cell">
                  {{ $t('admin.contests.participants.columns.start') }}
                </th>
                <th scope="col" class="px-2 py-2">
                  {{ $t('admin.contests.participants.columns.status') }}
                </th>
                <th scope="col" class="px-2 py-2">
                  <span class="sr-only">{{ $t('admin.contestOps.participants.manage') }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <ParticipantRow
                v-for="row in rows"
                :key="row.id"
                :contest-key="contest.key"
                :participation="row"
                :is-expanded="expandedId === row.id"
                :is-selected="selection.isSelected(row.id)"
                @toggle="toggle(row.id)"
                @select="(isOn: boolean) => selection.toggle(row.id, isOn)"
              />
            </tbody>
          </table>
        </div>
        <p class="text-sm text-muted">{{ $t('admin.contests.participants.footnote') }}</p>
        <footer class="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <span>{{
            $t('admin.contests.participants.pager', { page: query.page, pages: pageCount })
          }}</span>
          <div class="flex gap-2">
            <button
              type="button"
              class="min-h-11 rounded-pill border border-line px-4 font-semibold disabled:cursor-not-allowed"
              :disabled="query.page <= 1"
              @click="goToPage(query.page - 1)"
            >
              {{ $t('admin.contests.participants.previous') }}
            </button>
            <button
              type="button"
              class="min-h-11 rounded-pill border border-line px-4 font-semibold disabled:cursor-not-allowed"
              :disabled="query.page >= pageCount"
              @click="goToPage(query.page + 1)"
            >
              {{ $t('admin.contests.participants.next') }}
            </button>
          </div>
        </footer>
      </template>
    </QueryState>
    <BulkDisqualifyDialog
      v-model:visible="isBulkOpen"
      :contest-key="contest.key"
      :ids="selection.selected.value"
      :usernames="selectedNames"
      :disqualified="isBulkDisqualify"
      @done="onBulkDone"
    />
    <AddParticipationDialog
      v-model:visible="isAddOpen"
      :contest-key="contest.key"
      @added="showUser"
    />
  </div>
</template>
