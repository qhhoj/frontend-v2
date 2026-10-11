<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { OrganizationDetail } from '@/api/types/organizations';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatDateTime, formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import ManageSection from './ManageSection.vue';
import { MANAGE_LIST_SIZE, useManageLists } from './use-manage-lists';

/** The organization's first contests in the /contests order (upcoming soonest, then newest), with phase and start. */
const props = defineProps<{ organization: OrganizationDetail }>();
const locale = useLocaleStore();
const { t } = useI18n();
const { contests, contestTotal } = useManageLists(() => props.organization);
const rows = computed(() => contests.data.value?.items ?? []);
const allLabel = computed(() =>
  contestTotal.value > MANAGE_LIST_SIZE
    ? t('orgs.manage.contests.all', { count: formatNumber(contestTotal.value, locale.locale) })
    : undefined,
);
const PHASE_TONE: Record<string, string> = {
  running: 'bg-verdict-ac-bg text-verdict-ac',
  upcoming: 'bg-accent-soft text-accent-soft-text',
  ended: 'bg-surface-strong text-muted',
};
</script>

<template>
  <ManageSection
    data-testid="manage-contests"
    :title="$t('orgs.manage.contests.title')"
    :all-label="allLabel"
    :all-to="{ name: 'organization-contests', params: { slug: organization.slug } }"
  >
    <QueryState
      :loading="contests.isPending.value"
      :error="contests.error.value"
      @retry="contests.refetch()"
    >
      <template #skeleton><SkeletonBlock class="m-4 h-24 rounded-row" /></template>
      <ul v-if="rows.length" class="divide-y divide-line">
        <li v-for="contest in rows" :key="contest.key">
          <RouterLink
            :to="{ name: 'contest', params: { key: contest.key } }"
            class="flex min-h-11 items-center gap-3 px-4 py-2 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
          >
            <span class="min-w-0 flex-1">
              <span class="block truncate font-semibold">{{ contest.name }}</span>
              <time :datetime="contest.startTime" class="block text-xs text-muted">{{
                formatDateTime(contest.startTime, locale.locale)
              }}</time>
            </span>
            <span
              class="shrink-0 rounded-pill px-2 py-0.5 text-xs font-semibold"
              :class="PHASE_TONE[contest.phase]"
              >{{ $t(`contests.phase.${contest.phase}`) }}</span
            >
          </RouterLink>
        </li>
      </ul>
      <p v-else class="px-4 py-3 text-sm text-muted">{{ $t('orgs.manage.contests.empty') }}</p>
    </QueryState>
  </ManageSection>
</template>
