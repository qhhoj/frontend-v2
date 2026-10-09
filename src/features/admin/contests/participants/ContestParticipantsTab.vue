<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { useRoute, useRouter } from 'vue-router';
import { fetchParticipations, PARTICIPATIONS_PAGE_SIZE } from '@/api/contest-editing.api';
import type { EditableContest } from '@/api/types/contest-editing';
import EmptyState from '@/components/EmptyState.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useDebouncedText } from '@/lib/use-debounced-text';
import { formatDateTime, formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useViewerId } from '@/stores/use-viewer-id';
import AdminUserLabel from '../../ui/AdminUserLabel.vue';
import { ADMIN_INPUT_CLASS } from '../../ui/classes';
import ParticipationDisqualify from './ParticipationDisqualify.vue';
import { formatPenalty, participationKindKey } from './participations';

const props = defineProps<{ contest: EditableContest }>();
const route = useRoute();
const router = useRouter();
const viewer = useViewerId();
const locale = useLocaleStore();
const page = computed(() => Math.max(1, Number(route.query.page) || 1));
const userFilter = computed(() => String(route.query.user ?? ''));
/** The username box follows the URL (`?user=`) after a short pause; a new filter starts again at page 1. */
const typedUser = useDebouncedText(
  () => userFilter.value,
  (text) => {
    void router.replace({ query: { ...route.query, user: text || undefined, page: undefined } });
  },
);

const { data, error, isPending, refetch } = useQuery({
  queryKey: computed(() => [
    'admin',
    'participations',
    props.contest.key,
    viewer.value,
    page.value,
    userFilter.value,
  ]),
  queryFn: () =>
    fetchParticipations(props.contest.key, { page: page.value, user: userFilter.value }),
});
const rows = computed(() => data.value?.items ?? []);
const total = computed(() => data.value?.meta.total ?? 0);
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / PARTICIPATIONS_PAGE_SIZE)));
const goToPage = (target: number) =>
  router.push({ query: { ...route.query, page: String(target) } });
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div class="flex flex-col gap-1.5">
        <label for="participants-user" class="text-sm font-semibold">{{
          $t('admin.contests.participants.userLabel')
        }}</label>
        <input
          id="participants-user"
          v-model="typedUser"
          :class="ADMIN_INPUT_CLASS"
          :placeholder="$t('admin.contests.participants.userLabel')"
          autocomplete="off"
        />
      </div>
      <p class="text-sm text-muted">
        {{
          $t('admin.contests.participants.countLine', { total: formatNumber(total, locale.locale) })
        }}
      </p>
    </div>

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
          <table class="w-full min-w-[360px] text-sm">
            <thead class="text-left text-muted">
              <tr>
                <th scope="col" class="px-2 py-2">
                  {{ $t('admin.contests.participants.columns.user') }}
                </th>
                <th scope="col" class="hidden px-2 py-2 md:table-cell">
                  {{ $t('admin.contests.participants.columns.kind') }}
                </th>
                <th scope="col" class="hidden px-2 py-2 md:table-cell">
                  {{ $t('admin.contests.participants.columns.score') }}
                </th>
                <th scope="col" class="hidden px-2 py-2 md:table-cell">
                  {{ $t('admin.contests.participants.columns.penalty') }}
                </th>
                <th scope="col" class="hidden px-2 py-2 md:table-cell">
                  {{ $t('admin.contests.participants.columns.start') }}
                </th>
                <th scope="col" class="px-2 py-2">
                  {{ $t('admin.contests.participants.columns.status') }}
                </th>
                <th scope="col" class="px-2 py-2">
                  <span class="sr-only">{{ $t('admin.contests.participants.disqualify') }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.id" class="border-t border-line align-top">
                <td class="px-2 py-3">
                  <AdminUserLabel :username="row.user.username" :size="24" />
                </td>
                <td class="hidden px-2 py-3 md:table-cell">
                  {{
                    $t(
                      participationKindKey(row.virtual).key,
                      participationKindKey(row.virtual).params ?? {},
                    )
                  }}
                </td>
                <td class="hidden px-2 py-3 md:table-cell">
                  {{ formatNumber(row.score, locale.locale) }}
                </td>
                <td class="hidden px-2 py-3 md:table-cell">
                  {{ formatPenalty(row.cumtime, locale.locale) }}
                </td>
                <td class="hidden px-2 py-3 md:table-cell">
                  {{ formatDateTime(row.realStart, locale.locale) }}
                </td>
                <td class="px-2 py-3 font-semibold">
                  {{
                    row.isDisqualified
                      ? $t('admin.contests.participants.disqualified')
                      : $t('admin.contests.participants.valid')
                  }}
                </td>
                <td class="px-2 py-3">
                  <ParticipationDisqualify :contest-key="contest.key" :participation="row" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-sm text-muted">{{ $t('admin.contests.participants.footnote') }}</p>
        <footer class="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <span>{{ $t('admin.contests.participants.pager', { page, pages: pageCount }) }}</span>
          <div class="flex gap-2">
            <button
              type="button"
              class="min-h-11 rounded-pill border border-line px-4 font-semibold disabled:cursor-not-allowed"
              :disabled="page <= 1"
              @click="goToPage(page - 1)"
            >
              {{ $t('admin.contests.participants.previous') }}
            </button>
            <button
              type="button"
              class="min-h-11 rounded-pill border border-line px-4 font-semibold disabled:cursor-not-allowed"
              :disabled="page >= pageCount"
              @click="goToPage(page + 1)"
            >
              {{ $t('admin.contests.participants.next') }}
            </button>
          </div>
        </footer>
      </template>
    </QueryState>
  </div>
</template>
