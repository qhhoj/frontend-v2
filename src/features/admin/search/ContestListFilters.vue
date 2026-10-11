<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import AdminFilterTabs from '../ui/AdminFilterTabs.vue';
import type { AdminFilterTab } from '../ui/AdminFilterTabs.vue';
import { ADMIN_INPUT_CLASS } from '../ui/classes';
import { CONTEST_PHASE_FILTERS } from './index-search';
import { CONTEST_SCOPE_FILTERS, CONTEST_SORTS, contestFilterQueryOf } from './contest-list-filters';
import type { ContestFilterPatch, ContestListFilters } from './contest-list-filters';

/** Phase and scope tabs, sort and start dates of the staff contest list; every change lands in the address. */
defineProps<{ filters: ContestListFilters }>();
const emit = defineEmits<{ change: [patch: ContestFilterPatch] }>();
const route = useRoute();
const { t } = useI18n();
const phaseTabs = computed<AdminFilterTab[]>(() =>
  CONTEST_PHASE_FILTERS.map((phase) => ({
    key: phase,
    label: phase === 'all' ? t('admin.search.contests.all') : t(`contests.phase.${phase}`),
    to: { query: contestFilterQueryOf(route.query, { phase }) },
  })),
);
const scopeTabs = computed<AdminFilterTab[]>(() =>
  CONTEST_SCOPE_FILTERS.map((scope) => ({
    key: scope,
    label: t(`admin.search.contests.scopes.${scope}`),
    to: { query: contestFilterQueryOf(route.query, { scope }) },
  })),
);
const valueOf = (event: Event) => (event.target as HTMLInputElement | HTMLSelectElement).value;
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap gap-3">
      <AdminFilterTabs
        :tabs="phaseTabs"
        :current="filters.phase"
        :label="$t('admin.search.contests.phaseLabel')"
      />
      <AdminFilterTabs
        :tabs="scopeTabs"
        :current="filters.scope"
        :label="$t('admin.search.contests.scopeLabel')"
      />
    </div>
    <div class="grid gap-3 sm:grid-cols-3">
      <label class="flex flex-col gap-1.5 text-sm font-semibold">
        {{ $t('admin.search.contests.sort') }}
        <select
          :class="ADMIN_INPUT_CLASS"
          :value="filters.sort"
          @change="emit('change', { sort: valueOf($event) as ContestListFilters['sort'] })"
        >
          <option v-for="sort in CONTEST_SORTS" :key="sort" :value="sort">
            {{ $t(`admin.search.contests.sorts.${sort || 'default'}`) }}
          </option>
        </select>
      </label>
      <label class="flex flex-col gap-1.5 text-sm font-semibold">
        {{ $t('admin.search.contests.from') }}
        <input
          type="date"
          :class="ADMIN_INPUT_CLASS"
          :value="filters.from"
          @change="emit('change', { from: valueOf($event) })"
        />
      </label>
      <label class="flex flex-col gap-1.5 text-sm font-semibold">
        {{ $t('admin.search.contests.before') }}
        <input
          type="date"
          :class="ADMIN_INPUT_CLASS"
          :value="filters.before"
          @change="emit('change', { before: valueOf($event) })"
        />
      </label>
    </div>
  </div>
</template>
