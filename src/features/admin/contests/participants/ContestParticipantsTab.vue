<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { useRoute, useRouter } from 'vue-router';
import { fetchParticipations, PARTICIPATIONS_PAGE_SIZE } from '@/api/contest-editing.api';
import type { EditableContest } from '@/api/types/contest-editing';
import EmptyState from '@/components/EmptyState.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useViewerId } from '@/stores/use-viewer-id';
import { ADMIN_PRIMARY_CLASS } from '../../ui/classes';
import AddParticipationDialog from './AddParticipationDialog.vue';
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
/** After an add, the list shows that user's rows. */
const showUser = (username: string) =>
  router.replace({ query: { ...route.query, user: username, page: undefined } });
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
                @toggle="toggle(row.id)"
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
    <AddParticipationDialog
      v-model:visible="isAddOpen"
      :contest-key="contest.key"
      @added="showUser"
    />
  </div>
</template>
