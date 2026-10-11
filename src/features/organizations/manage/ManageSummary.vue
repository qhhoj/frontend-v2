<script setup lang="ts">
import { Plus } from 'lucide-vue-next';
import { computed } from 'vue';
import type { OrganizationDetail } from '@/api/types/organizations';
import { BUTTON } from '@/features/account/settings/buttons';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useManageLists } from './use-manage-lists';

/** Mock-up 4A header: the title, the two create buttons and four number tiles that open the matching list. */
const props = defineProps<{ organization: OrganizationDetail }>();
const locale = useLocaleStore();
const { pendingTotal, problemTotal, contestTotal } = useManageLists(() => props.organization);
const viewer = computed(() => props.organization.viewer);
const createQuery = computed(() => ({ organization: props.organization.slug }));
const params = computed(() => ({ slug: props.organization.slug }));
const count = (value: number) => formatNumber(value, locale.locale);
const TILE =
  'glass flex min-h-11 flex-col gap-1 rounded-card px-4 py-3 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus';
</script>

<template>
  <section data-testid="manage-summary" class="flex flex-col gap-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="min-w-0 flex-1">
        <h2 class="font-display text-xl font-bold">
          {{ $t('orgs.manage.title', { name: organization.name }) }}
        </h2>
        <p class="text-sm text-muted">
          {{
            pendingTotal
              ? $t('orgs.manage.pendingLead', { count: count(pendingTotal) })
              : $t('orgs.manage.noPending')
          }}
        </p>
      </div>
      <div
        v-if="viewer?.canCreateProblem || viewer?.canCreateContest"
        class="grid grid-cols-2 gap-2 sm:flex"
      >
        <RouterLink
          v-if="viewer?.canCreateProblem"
          data-testid="manage-create-problem"
          :to="{ name: 'admin-problemNew', query: createQuery }"
          :class="BUTTON.primary"
        >
          <Plus class="size-4" aria-hidden="true" />{{ $t('create.problem') }}
        </RouterLink>
        <RouterLink
          v-if="viewer?.canCreateContest"
          data-testid="manage-create-contest"
          :to="{ name: 'admin-contestNew', query: createQuery }"
          :class="BUTTON.secondary"
        >
          <Plus class="size-4" aria-hidden="true" />{{ $t('create.contest') }}
        </RouterLink>
      </div>
    </div>
    <ul class="grid grid-cols-2 gap-3 lg:grid-cols-4" :aria-label="$t('orgs.manage.tiles.label')">
      <li>
        <RouterLink :to="{ name: 'organization-members', params }" :class="TILE">
          <span class="text-sm text-muted">{{ $t('orgs.manage.tiles.members') }}</span>
          <b class="font-display text-2xl tabular-nums">{{ count(organization.memberCount) }}</b>
        </RouterLink>
      </li>
      <li>
        <a
          href="#org-requests"
          data-testid="manage-tile-pending"
          :class="[TILE, pendingTotal ? 'ring-2 ring-accent' : '']"
        >
          <span class="text-sm text-muted">{{ $t('orgs.manage.tiles.pending') }}</span>
          <b class="font-display text-2xl tabular-nums">{{ count(pendingTotal) }}</b>
        </a>
      </li>
      <li>
        <RouterLink :to="{ name: 'organization-problems', params }" :class="TILE">
          <span class="text-sm text-muted">{{ $t('orgs.manage.tiles.problems') }}</span>
          <b class="font-display text-2xl tabular-nums">{{ count(problemTotal) }}</b>
        </RouterLink>
      </li>
      <li>
        <RouterLink :to="{ name: 'organization-contests', params }" :class="TILE">
          <span class="text-sm text-muted">{{ $t('orgs.manage.tiles.contests') }}</span>
          <b class="font-display text-2xl tabular-nums">{{ count(contestTotal) }}</b>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
