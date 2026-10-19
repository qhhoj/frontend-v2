<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue';
import { Plus } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import StateBit from '@/components/StateBit.vue';
import StatePanel from '@/components/StatePanel.vue';
import { pageFromQuery } from '@/lib/paging';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { usePermissions } from '@/stores/use-permissions';
import AppButton from '@/components/ui/AppButton.vue';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';
import type { SegmentOption } from '@/components/ui/SegmentedControl.vue';
import CreateOrganizationDialog from './create/CreateOrganizationDialog.vue';
import { useUserPageQuery } from '@/features/users/users.queries';
import OrganizationCard from './OrganizationCard.vue';
import OrganizationCardSkeleton from './OrganizationCardSkeleton.vue';
import { useOrganizationsQuery } from './organizations.queries';
import { rankByPoints } from './org-visuals';

type Filter = 'all' | 'mine' | 'open';
const FILTERS: Filter[] = ['all', 'mine', 'open'];

const route = useRoute();
const { t } = useI18n();
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
const filters = computed<SegmentOption<Filter>[]>(() =>
  (isSignedIn.value ? FILTERS : FILTERS.filter((name) => name !== 'mine')).map((key) => ({
    value: key,
    label: `${t(`orgs.filters.${key}`)} · ${count(key)}`,
  })),
);
const isListEmpty = computed(() => ranked.value.length === 0);
/** Legacy `CreateOrganization` is gated on `judge.add_organization` alone. */
const { can } = usePermissions();
const canCreate = computed(() => can('judge.add_organization'));
const isCreateOpen = ref(false);
</script>

<template>
  <div class="page-column">
    <PageHeader :title="$t('orgs.title')" :lead="$t('orgs.lead')">
      <template #start><StateBit variant="community" size="inline" /></template>
      <template #actions>
        <SegmentedControl
          v-if="!isListEmpty"
          v-model="filter"
          :options="filters"
          :label="$t('orgs.filtersLabel')"
          size="sm"
        />
        <AppButton
          v-if="canCreate"
          data-testid="create-organization"
          tone="primary"
          @click="isCreateOpen = true"
        >
          <template #icon><Plus class="size-4" aria-hidden="true" /></template>
          <span class="max-sm:hidden">{{ $t('orgAdmin.create.open') }}</span>
          <span class="sm:hidden">{{ $t('orgAdmin.create.openShort') }}</span>
        </AppButton>
      </template>
    </PageHeader>
    <CreateOrganizationDialog v-if="canCreate" v-model:visible="isCreateOpen" />

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
