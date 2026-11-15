<script setup lang="ts">
import { computed } from 'vue';
import { Plus } from 'lucide-vue-next';
import type { OrganizationDetail } from '@/api/types/organizations';
import AppButton from '@/components/ui/AppButton.vue';
import Chip from '@/components/ui/Chip.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useJoinRequestsQuery } from './organizations.queries';

/**
 * The manager's strip at the top of the overview: create buttons and shortcut links on one wrapping line. The create buttons show only with the
 * matching backend flag (`viewer.canCreateProblem` / `canCreateContest`); the shortcuts lead to the organization's problems,
 * contests and join requests.
 */
const props = defineProps<{ organization: OrganizationDetail }>();
const locale = useLocaleStore();
const viewer = computed(() => props.organization.viewer);
const canAdminister = computed(() => viewer.value?.canAdminister === true);
const pending = useJoinRequestsQuery(() => props.organization.slug, 'P', 1, canAdminister);
const pendingTotal = computed(() => pending.data.value?.meta.total ?? 0);
const createQuery = computed(() => ({ organization: props.organization.slug }));
const params = computed(() => ({ slug: props.organization.slug }));
const LINK =
  'inline-flex min-h-(--qh-control) items-center gap-1 text-sm font-semibold text-accent-text hover:underline';
</script>

<template>
  <nav
    data-testid="organization-manage-card"
    :aria-label="$t('orgs.manageCard.title')"
    class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-row border border-line bg-surface-solid px-3 py-2"
  >
    <span class="text-sm font-semibold">{{ $t('orgs.manageCard.title') }}</span>
    <AppButton
      v-if="viewer?.canCreateProblem"
      data-testid="org-create-problem"
      size="sm"
      tone="primary"
      :to="{ name: 'admin-problemNew', query: createQuery }"
    >
      <template #icon><Plus class="size-4" aria-hidden="true" /></template>
      {{ $t('create.problem') }}
    </AppButton>
    <AppButton
      v-if="viewer?.canCreateContest"
      data-testid="org-create-contest"
      size="sm"
      :to="{ name: 'admin-contestNew', query: createQuery }"
    >
      <template #icon><Plus class="size-4" aria-hidden="true" /></template>
      {{ $t('create.contest') }}
    </AppButton>
    <span class="flex flex-wrap items-center gap-x-4 md:ml-auto">
      <RouterLink :to="{ name: 'organization-problems', params }" :class="LINK">
        {{ $t('orgs.manageCard.problems') }}
      </RouterLink>
      <RouterLink :to="{ name: 'organization-contests', params }" :class="LINK">
        {{ $t('orgs.manageCard.contests') }}
      </RouterLink>
      <RouterLink v-if="canAdminister" :to="{ name: 'organization-manage', params }" :class="LINK">
        {{ $t('orgs.manageCard.requests') }}
        <Chip v-if="pendingTotal" tone="accent" size="sm">
          {{ $t('orgs.manageCard.pending', { count: formatNumber(pendingTotal, locale.locale) }) }}
        </Chip>
      </RouterLink>
    </span>
  </nav>
</template>
