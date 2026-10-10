<script setup lang="ts">
import { computed, ref } from 'vue';
import { ApiError } from '@/api/client';
import type { PolygonProblem } from '@/api/types/polygon';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import ToolbarSearch from '@/components/ToolbarSearch.vue';
import { formatClock } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { ADMIN_BUTTON_CLASS, ADMIN_PRIMARY_CLASS } from '../../ui/classes';
import PolygonNotConnected from './PolygonNotConnected.vue';
import PolygonNothingShared from './PolygonNothingShared.vue';
import PolygonProblemCard from './PolygonProblemCard.vue';
import { PICK_FILTERS, filterCounts, filterProblems } from './pick-filter';
import type { PickFilter } from './pick-filter';
import { usePolygonProblemsQuery, useRefreshPolygonProblems } from './polygon.queries';

/** Step 1: the shared problems as cards, a search and package-state chips; "Tiếp tục" once a READY card is picked. */
defineProps<{ accountName: string; selected: PolygonProblem | null }>();
const emit = defineEmits<{ select: [problem: PolygonProblem]; next: [] }>();
const locale = useLocaleStore();
const problems = usePolygonProblemsQuery();
const refreshList = useRefreshPolygonProblems();
const search = ref('');
const filter = ref<PickFilter>('all');
const list = computed(() => problems.data.value ?? []);
const shown = computed(() => filterProblems(list.value, search.value, filter.value));
const counts = computed(() => filterCounts(list.value, search.value));
const isNotConnected = computed(
  () =>
    problems.error.value instanceof ApiError &&
    problems.error.value.code === 'polygon_not_connected',
);
const updatedAt = computed(() =>
  problems.dataUpdatedAt.value
    ? formatClock(new Date(problems.dataUpdatedAt.value).toISOString(), locale.locale)
    : '',
);

const isRefreshing = ref(false);
const refreshFailure = ref<unknown>(null);
async function refresh() {
  if (isRefreshing.value) return;
  isRefreshing.value = true;
  refreshFailure.value = null;
  try {
    await refreshList();
  } catch (error) {
    refreshFailure.value = error;
  } finally {
    isRefreshing.value = false;
  }
}
</script>

<template>
  <PolygonNotConnected v-if="isNotConnected" />
  <QueryState
    v-else
    :loading="problems.isPending.value"
    :error="problems.error.value"
    @retry="problems.refetch()"
  >
    <template #skeleton>
      <SkeletonBlock data-skeleton-region="polygon-problems" class="h-96 w-full rounded-card" />
    </template>
    <div class="flex flex-col gap-5">
      <AdminStatus v-if="refreshFailure" kind="refused" :text="failureTextOf(refreshFailure)" />
      <PolygonNothingShared
        v-if="list.length === 0"
        :account-name="accountName"
        :is-refreshing="isRefreshing"
        @refresh="refresh"
      />
      <template v-else>
        <GlassCard class="flex flex-col gap-4 p-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="font-bold">{{ $t('admin.polygonLink.pick.title') }}</h2>
            <div class="flex flex-wrap items-center gap-3 text-sm text-muted">
              <span v-if="updatedAt">{{
                $t('admin.polygonLink.pick.updatedAt', { time: updatedAt })
              }}</span>
              <button
                type="button"
                :class="ADMIN_BUTTON_CLASS"
                :aria-busy="isRefreshing || undefined"
                @click="refresh"
              >
                {{ $t('admin.polygonLink.pick.refresh') }}
              </button>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <div class="min-w-[min(100%,16rem)] flex-1">
              <ToolbarSearch
                v-model="search"
                class="flex w-full"
                :label="$t('admin.polygonLink.pick.search')"
                :placeholder="$t('admin.polygonLink.pick.searchPlaceholder')"
                :maxlength="100"
              />
            </div>
            <div
              role="group"
              :aria-label="$t('admin.polygonLink.pick.filterLabel')"
              class="flex flex-wrap gap-2"
            >
              <button
                v-for="chip in PICK_FILTERS"
                :key="chip"
                type="button"
                :aria-pressed="filter === chip"
                class="min-h-11 rounded-pill border px-3 text-sm font-semibold"
                :class="
                  filter === chip
                    ? 'border-content bg-content text-ground'
                    : 'border-line-strong bg-surface-solid hover:bg-surface-hover'
                "
                @click="filter = chip"
              >
                {{ $t(`admin.polygonLink.pick.filters.${chip}`) }} {{ counts[chip] }}
              </button>
            </div>
          </div>
          <fieldset class="m-0 min-w-0 border-0 p-0">
            <legend class="sr-only">{{ $t('admin.polygonLink.pick.title') }}</legend>
            <div
              v-if="shown.length > 0"
              class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
              data-testid="polygon-cards"
            >
              <PolygonProblemCard
                v-for="problem in shown"
                :key="problem.id"
                :problem="problem"
                :is-selected="selected?.id === problem.id"
                @select="emit('select', $event)"
              />
            </div>
            <p v-else class="py-6 text-center text-sm text-muted">
              {{ $t('admin.polygonLink.pick.noMatch') }}
            </p>
          </fieldset>
        </GlassCard>
        <GlassCard class="flex flex-wrap items-center gap-3 p-4">
          <p class="min-w-[min(100%,14rem)] flex-1 text-sm" aria-live="polite">
            <template v-if="selected">
              {{ $t('admin.polygonLink.pick.selected') }}
              <strong>{{ selected.title ?? selected.name }}</strong>
              <span class="font-mono text-muted">
                ({{ selected.id }}, r{{ selected.revision }})</span
              >
            </template>
            <span v-else class="text-muted">{{ $t('admin.polygonLink.pick.noneSelected') }}</span>
          </p>
          <RouterLink :to="{ name: 'admin-problemImport' }" :class="ADMIN_BUTTON_CLASS">{{
            $t('admin.polygonLink.wizard.zipInstead')
          }}</RouterLink>
          <button
            type="button"
            :class="ADMIN_PRIMARY_CLASS"
            :aria-disabled="!selected || undefined"
            @click="selected && emit('next')"
          >
            {{ $t('admin.polygonLink.pick.next') }}
          </button>
        </GlassCard>
      </template>
    </div>
  </QueryState>
</template>
