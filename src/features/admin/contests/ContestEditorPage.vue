<script setup lang="ts">
import { formatLabel } from '@/lib/contest-format';
import { ExternalLink, Users } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminBit from '../shell/AdminBit.vue';
import AdminChip from '../ui/AdminChip.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminTabs from '../ui/AdminTabs.vue';
import { routeTabs } from '../ui/admin-tabs';
import { isNotFound } from '../ui/admin-errors';
import { CARD, buttonClass } from '../ui/controls';
import { useEditableContestQuery } from './contest-editing.queries';
import { CONTEST_TABS, contestTabComponent, contestTabCount, contestTabOf } from './contest-tabs';
import ContestPhaseChip from './list/ContestPhaseChip.vue';
import ContestWindowText from './list/ContestWindowText.vue';

/** One contest's editor: a header with its phase, format, window and size, sticky section tabs, then the open tab. */
const route = useRoute();
const locale = useLocaleStore();
const key = computed(() => String(route.params.key));
const { data: contest, error, isPending, refetch } = useEditableContestQuery(key);
const isMissing = computed(() => isNotFound(error.value));
const isEditable = computed(() =>
  Boolean(contest.value?.viewer.canEdit && contest.value.settings !== null),
);
const tabComponent = computed(() => {
  const tab = contestTabOf(route.name);
  return tab ? contestTabComponent(tab) : null;
});
const tabs = computed(() => {
  const loaded = contest.value;
  if (!loaded) return [];
  return routeTabs(CONTEST_TABS, { key: loaded.key }).map((tab, index) => ({
    ...tab,
    count: contestTabCount(CONTEST_TABS[index]!.id, loaded),
  }));
});
const LIST = { name: 'admin-contests' } as const;
</script>

<template>
  <QueryState :loading="isPending" :error="isMissing ? null : error" @retry="refetch()">
    <template #skeleton>
      <div class="flex flex-col gap-4">
        <SkeletonBlock
          data-skeleton-region="contest-editor-header"
          class="h-[11.5rem] w-full sm:h-[4.75rem]"
        />
        <SkeletonBlock data-skeleton-region="contest-editor-body" class="h-64 w-full" />
      </div>
    </template>
    <div v-if="isMissing" :class="[CARD, 'flex flex-col items-start gap-3 p-6']">
      <p class="m-0 font-semibold">{{ $t('admin.contests.notFound', { key }) }}</p>
      <RouterLink :to="LIST" :class="buttonClass('secondary')">
        {{ $t('admin.contests.backToList') }}
      </RouterLink>
    </div>
    <div v-else-if="contest" class="flex flex-col gap-4">
      <AdminPageHeader
        :trail="[{ label: contest.key, mono: true }]"
        :title="contest.name"
        :back="{ to: LIST, label: $t('admin.contests.backToList') }"
      >
        <template #meta>
          <ContestPhaseChip :phase="contest.phase" />
          <AdminChip>{{ formatLabel(contest.formatName) }}</AdminChip>
          <ContestWindowText :start-time="contest.startTime" :end-time="contest.endTime" />
          <span class="inline-flex items-center gap-1 whitespace-nowrap">
            <Users aria-hidden="true" class="size-3.5" :stroke-width="1.75" />
            {{
              $t('admin.contests.participantCount', {
                count: formatNumber(contest.userCount, locale.locale),
              })
            }}
          </span>
        </template>
        <template #actions>
          <RouterLink
            :to="{ name: 'contest', params: { key: contest.key } }"
            :class="buttonClass('secondary')"
          >
            <ExternalLink aria-hidden="true" class="size-4" :stroke-width="1.75" />
            {{ $t('admin.contests.view') }}
          </RouterLink>
        </template>
      </AdminPageHeader>
      <div v-if="!isEditable" :class="[CARD, 'flex flex-wrap items-center gap-3 p-5']">
        <AdminBit placement="forbidden" />
        <p class="m-0">{{ $t('admin.contests.cannotEdit', { key: contest.key }) }}</p>
      </div>
      <template v-else>
        <AdminTabs :tabs="tabs" :label="$t('admin.contests.tabsLabel')" sticky />
        <component :is="tabComponent" v-if="tabComponent" :contest="contest" />
      </template>
    </div>
  </QueryState>
</template>
