<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { OrganizationDetail } from '@/api/types/organizations';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import ManageSection from './ManageSection.vue';
import { MANAGE_LIST_SIZE, useManageLists } from './use-manage-lists';

/** The organization's first problems (the API lists them by code), each opening its page. */
const props = defineProps<{ organization: OrganizationDetail }>();
const locale = useLocaleStore();
const { t } = useI18n();
const { problems, problemTotal } = useManageLists(() => props.organization);
const rows = computed(() => (problems.data.value?.items ?? []).slice(0, MANAGE_LIST_SIZE));
const allLabel = computed(() =>
  problemTotal.value > MANAGE_LIST_SIZE
    ? t('orgs.manage.problems.all', { count: formatNumber(problemTotal.value, locale.locale) })
    : undefined,
);
</script>

<template>
  <ManageSection
    data-testid="manage-problems"
    :title="$t('orgs.manage.problems.title')"
    :all-label="allLabel"
    :all-to="{ name: 'organization-problems', params: { slug: organization.slug } }"
  >
    <QueryState
      :loading="problems.isPending.value"
      :error="problems.error.value"
      @retry="problems.refetch()"
    >
      <template #skeleton><SkeletonBlock class="m-4 h-24 rounded-row" /></template>
      <ul v-if="rows.length" class="divide-y divide-line">
        <li v-for="problem in rows" :key="problem.code">
          <RouterLink
            :to="{ name: 'problem', params: { code: problem.code } }"
            class="flex min-h-11 items-center gap-3 px-4 py-2 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
          >
            <span class="min-w-0 flex-1">
              <span class="block truncate font-semibold">{{ problem.name }}</span>
              <span class="block truncate font-mono text-xs text-muted">{{ problem.code }}</span>
            </span>
            <span
              class="shrink-0 rounded-pill px-2 py-0.5 text-xs font-semibold"
              :class="
                problem.isPublic
                  ? 'bg-verdict-ac-bg text-verdict-ac'
                  : 'bg-surface-strong text-muted'
              "
              >{{
                problem.isPublic
                  ? $t('orgs.manage.problems.shown')
                  : $t('orgs.manage.problems.hidden')
              }}</span
            >
          </RouterLink>
        </li>
      </ul>
      <p v-else class="px-4 py-3 text-sm text-muted">{{ $t('orgs.manage.problems.empty') }}</p>
    </QueryState>
  </ManageSection>
</template>
