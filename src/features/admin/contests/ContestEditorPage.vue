<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatDateTime, formatNumber } from '@/lib/format';
import { translate } from '@/i18n';
import { useLocaleStore } from '@/stores/locale.store';
import AdminBit from '../shell/AdminBit.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminTabs from '../ui/AdminTabs.vue';
import { useEditableContestQuery } from './contest-editing.queries';
import { CONTEST_TABS, contestTabComponent, contestTabOf } from './contest-tabs';
import { isNotFound } from '../ui/admin-errors';

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

const summaryLine = computed(() => {
  if (!contest.value) return '';
  const { formatName, startTime, endTime, userCount } = contest.value;
  return translate('admin.contests.summaryLine', {
    format: translate(`admin.contests.formats.${formatName}`),
    start: formatDateTime(startTime, locale.locale),
    end: formatDateTime(endTime, locale.locale),
    count: formatNumber(userCount, locale.locale),
  });
});
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
    <p v-if="isMissing">{{ $t('admin.contests.notFound', { key }) }}</p>
    <div v-else-if="contest" class="flex flex-col gap-6">
      <AdminPageHeader
        :crumbs="[
          { label: $t('admin.contests.crumb'), to: { name: 'admin-contests' } },
          { label: contest.key },
        ]"
        :title="contest.name"
        :lead="summaryLine"
      >
        <template #actions>
          <RouterLink
            :to="{ name: 'contest', params: { key: contest.key } }"
            class="inline-flex min-h-11 items-center rounded-pill border border-line-strong px-4 font-semibold hover:bg-surface-hover"
          >
            {{ $t('admin.contests.view') }}
          </RouterLink>
        </template>
      </AdminPageHeader>
      <p v-if="!isEditable" class="glass flex flex-wrap items-center gap-3 rounded-panel p-5">
        <AdminBit placement="forbidden" />
        <span>{{ $t('admin.contests.cannotEdit', { key: contest.key }) }}</span>
      </p>
      <template v-else>
        <AdminTabs
          :tabs="CONTEST_TABS"
          :params="{ key: contest.key }"
          :label="$t('admin.contests.tabsLabel')"
        />
        <component :is="tabComponent" v-if="tabComponent" :contest="contest" />
      </template>
    </div>
  </QueryState>
</template>
