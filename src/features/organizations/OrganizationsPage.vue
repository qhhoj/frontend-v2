<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import StatePanel from '@/components/StatePanel.vue';
import { pageFromQuery } from '@/lib/paging';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { useUserPageQuery } from '@/features/users/users.queries';
import OrganizationCard from './OrganizationCard.vue';
import OrganizationCardSkeleton from './OrganizationCardSkeleton.vue';
import { useOrganizationsQuery } from './organizations.queries';
import { rankByPoints } from './org-visuals';

type Filter = 'all' | 'mine' | 'open';
const FILTERS: Filter[] = ['all', 'mine', 'open'];

const route = useRoute();
const session = useSessionStore();
const locale = useLocaleStore();
const page = computed(() => pageFromQuery(route.query.page));
const list = useOrganizationsQuery(page);
const filter = ref<Filter>('all');

/** Anonymous visitors send no profile request: the username is empty and the query stays idle. */
const viewerUsername = computed(() => session.user?.username ?? '');
const { data: viewerPage } = useUserPageQuery(viewerUsername);
const myIds = computed(
  () => new Set((viewerPage.value?.organizations ?? []).map((entry) => entry.id)),
);
const isSignedIn = computed(() => session.user !== null);

/** The API orders by name; the rank is the place by performance points among the organizations loaded. */
const ranked = computed(() => rankByPoints(list.data.value?.items ?? []));
const predicates: Record<Filter, (entry: (typeof ranked.value)[number]) => boolean> = {
  all: () => true,
  mine: ({ item }) => myIds.value.has(item.id),
  open: ({ item }) => item.isOpen,
};
const visible = computed(() => ranked.value.filter(predicates[filter.value]));
const count = (key: Filter) =>
  formatNumber(ranked.value.filter(predicates[key]).length, locale.locale);
const filters = computed(() =>
  isSignedIn.value ? FILTERS : FILTERS.filter((name) => name !== 'mine'),
);
const isListEmpty = computed(() => ranked.value.length === 0);
</script>

<template>
  <div class="page-column">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <header class="flex flex-col gap-1">
        <h1 class="page-title">{{ $t('orgs.title') }}</h1>
        <p class="text-muted">{{ $t('orgs.lead') }}</p>
      </header>
      <div
        v-if="!isListEmpty"
        role="group"
        :aria-label="$t('orgs.filtersLabel')"
        class="flex gap-1.5 rounded-pill bg-surface-hover p-1"
      >
        <button
          v-for="key in filters"
          :key="key"
          type="button"
          :aria-pressed="filter === key"
          class="min-h-9 rounded-pill px-4 text-sm"
          :class="
            filter === key ? 'bg-surface-solid font-bold text-content shadow-glow' : 'text-muted'
          "
          @click="filter = key"
        >
          {{ $t(`orgs.filters.${key}`) }} · {{ count(key) }}
        </button>
      </div>
    </div>

    <QueryState :loading="list.isPending.value" :error="list.error.value" @retry="list.refetch()">
      <template #skeleton>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <OrganizationCardSkeleton v-for="card in 6" :key="card" />
        </div>
      </template>
      <StatePanel
        v-if="isListEmpty"
        kind="communityEmpty"
        :title="$t('orgs.emptyPublicTitle')"
        :body="$t('orgs.emptyPublicBody')"
      />
      <StatePanel
        v-else-if="visible.length === 0"
        kind="communityEmpty"
        :title="$t('orgs.emptyFilterTitle')"
        :body="$t('orgs.emptyFilterBody')"
      />
      <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <OrganizationCard
          v-for="{ item, rank } in visible"
          :key="item.id"
          :organization="item"
          :rank="rank"
          :is-member="myIds.has(item.id)"
          :is-signed-in="isSignedIn"
        />
      </div>
    </QueryState>
    <NumberedPager v-if="list.data.value" :meta="list.data.value.meta" :label="$t('orgs.pager')" />
  </div>
</template>
