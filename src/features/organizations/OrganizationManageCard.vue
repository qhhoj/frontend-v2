<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import { computed } from 'vue';
import { ChevronRight, Plus } from 'lucide-vue-next';
import InlineBit from '@/components/InlineBit.vue';
import type { OrganizationDetail } from '@/api/types/organizations';
import AppButton from '@/components/ui/AppButton.vue';
import Chip from '@/components/ui/Chip.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useJoinRequestsQuery } from './organizations.queries';

/**
 * Mock-up 1B: the "Quản lý tổ chức" card of the overview, for administrators. The create buttons show only with the
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
const ROW =
  'flex min-h-11 items-center gap-2 rounded-row px-2 text-sm font-semibold text-content hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus';
</script>

<template>
  <Card
    data-testid="organization-manage-card"
    :aria-label="$t('orgs.manageCard.title')"
    padding="md"
    class="flex flex-col gap-4 ring-2 ring-accent"
  >
    <div class="flex items-center gap-3">
      <InlineBit kind="staff" />
      <div class="min-w-0">
        <h2 class="font-display text-base font-bold text-accent-text">
          {{ $t('orgs.manageCard.title') }}
        </h2>
        <p class="text-sm text-muted">{{ $t('orgs.manageCard.lead') }}</p>
      </div>
    </div>
    <div v-if="viewer?.canCreateProblem || viewer?.canCreateContest" class="flex flex-col gap-2.5">
      <AppButton
        v-if="viewer?.canCreateProblem"
        data-testid="org-create-problem"
        tone="primary"
        :to="{ name: 'admin-problemNew', query: createQuery }"
      >
        <template #icon><Plus class="size-4" aria-hidden="true" /></template>
        {{ $t('create.problem') }}
      </AppButton>
      <AppButton
        v-if="viewer?.canCreateContest"
        data-testid="org-create-contest"
        :to="{ name: 'admin-contestNew', query: createQuery }"
      >
        <template #icon><Plus class="size-4" aria-hidden="true" /></template>
        {{ $t('create.contest') }}
      </AppButton>
    </div>
    <nav
      :aria-label="$t('orgs.manageCard.shortcuts')"
      class="flex flex-col border-t border-line pt-2"
    >
      <RouterLink :to="{ name: 'organization-problems', params }" :class="ROW">
        <span class="flex-1">{{ $t('orgs.manageCard.problems') }}</span>
        <ChevronRight class="size-4 text-accent-text" aria-hidden="true" />
      </RouterLink>
      <RouterLink :to="{ name: 'organization-contests', params }" :class="ROW">
        <span class="flex-1">{{ $t('orgs.manageCard.contests') }}</span>
        <ChevronRight class="size-4 text-accent-text" aria-hidden="true" />
      </RouterLink>
      <RouterLink v-if="canAdminister" :to="{ name: 'organization-manage', params }" :class="ROW">
        <span class="flex-1">{{ $t('orgs.manageCard.requests') }}</span>
        <Chip v-if="pendingTotal" tone="accent">
          {{ $t('orgs.manageCard.pending', { count: formatNumber(pendingTotal, locale.locale) }) }}
        </Chip>
        <ChevronRight class="size-4 text-accent-text" aria-hidden="true" />
      </RouterLink>
    </nav>
  </Card>
</template>
