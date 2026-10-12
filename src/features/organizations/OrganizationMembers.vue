<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import type { MemberSort } from '@/api/types/organizations';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import StatePanel from '@/components/StatePanel.vue';
import Tabs from '@/components/ui/Tabs.vue';
import type { TabItem } from '@/components/ui/Tabs.vue';
import { formatNumber } from '@/lib/format';
import { pageFromQuery } from '@/lib/paging';
import { useLocaleStore } from '@/stores/locale.store';
import MemberRows from './MemberRows.vue';
import type { MemberColumn } from './MemberRows.vue';
import { useMembersQuery } from './organizations.queries';
import { useOrganization } from './use-organization';

/** The sorts a member list offers; the default is the first. */
const SORT_OPTIONS: Array<Exclude<MemberSort, 'rating'>> = [
  'performancePoints',
  'points',
  'problemCount',
];
const PAGE_SIZE = 100;

const route = useRoute();
const locale = useLocaleStore();
const { slug } = useOrganization();
const sort = computed<Exclude<MemberSort, 'rating'>>(() => {
  const value = String(route.query.sort ?? SORT_OPTIONS[0]);
  return SORT_OPTIONS.find((option) => option === value) ?? SORT_OPTIONS[0]!;
});
const page = computed(() => pageFromQuery(route.query.page));
const { t } = useI18n();
const sortTabs = computed<TabItem[]>(() =>
  SORT_OPTIONS.map((option) => ({
    key: option,
    label: t(`orgs.columns.${option}`),
    to: {
      name: 'organization-members',
      params: { slug: slug.value },
      query: option === SORT_OPTIONS[0] ? {} : { sort: option },
    },
  })),
);
const { data, error, isPending, refetch } = useMembersQuery(slug, () => ({
  sort: sort.value,
  page: page.value,
  pageSize: PAGE_SIZE,
}));
/** The sorted column first, then the solved count (or the reverse when solved is the sort). */
const columns = computed<MemberColumn[]>(() =>
  sort.value === 'problemCount'
    ? ['problemCount', 'performancePoints']
    : [sort.value, 'problemCount'],
);
const members = computed(() => data.value?.items ?? []);
const footer = computed(() => {
  const first = (page.value - 1) * PAGE_SIZE + 1;
  return {
    first: formatNumber(first, locale.locale),
    last: formatNumber(first + members.value.length - 1, locale.locale),
    total: formatNumber(data.value?.meta.total ?? 0, locale.locale),
  };
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <Tabs
      :model-value="sort"
      :items="sortTabs"
      :label="$t('orgMembership.sortLabel')"
      overflow="scroll"
    />
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><SkeletonBlock class="h-64 w-full" /></template>
      <StatePanel
        v-if="!members.length"
        kind="communityEmpty"
        :title="$t('orgMembership.noMembers')"
      />
      <template v-else>
        <div class="overflow-x-auto rounded-card border border-line bg-surface p-4">
          <MemberRows :members="members" :columns="columns" />
        </div>
        <p class="text-sm text-muted">
          {{ $t('orgMembership.membersFooter', footer) }}
        </p>
      </template>
      <NumberedPager
        v-if="data"
        :meta="data.meta"
        :label="$t('orgMembership.membersPager')"
        class="mt-2"
      />
    </QueryState>
  </div>
</template>
