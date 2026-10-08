<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import StatePanel from '@/components/StatePanel.vue';
import { pageFromQuery } from '@/lib/paging';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { useUserPageQuery } from '@/features/users/users.queries';
import OrganizationBadge from './OrganizationBadge.vue';
import OrganizationCard from './OrganizationCard.vue';
import OrganizationCardSkeleton from './OrganizationCardSkeleton.vue';
import { useOrganizationsQuery } from './organizations.queries';

const route = useRoute();
const session = useSessionStore();
const locale = useLocaleStore();
const page = computed(() => pageFromQuery(route.query.page));
const list = useOrganizationsQuery(page);
const organizations = computed(() => list.data.value?.items ?? []);
const total = computed(() => formatNumber(list.data.value?.meta.total ?? 0, locale.locale));

/** Anonymous visitors send no profile request: the username is empty and the query stays idle. */
const viewerUsername = computed(() => session.user?.username ?? '');
const { data: viewerPage } = useUserPageQuery(viewerUsername);
const myOrganizations = computed(() => viewerPage.value?.organizations ?? []);
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-8">
    <header>
      <h1 class="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {{ $t('orgs.title') }}
      </h1>
      <p class="mt-1 text-muted">{{ $t('orgs.lead') }}</p>
    </header>

    <section
      v-if="myOrganizations.length"
      data-testid="my-organizations"
      class="glass flex flex-col gap-3 rounded-card p-5"
    >
      <h2 class="font-display text-lg font-semibold">
        {{ $t('orgs.mine') }} {{ formatNumber(myOrganizations.length, locale.locale) }}
      </h2>
      <ul class="flex flex-col gap-2">
        <li
          v-for="organization in myOrganizations"
          :key="organization.id"
          class="flex flex-wrap items-center gap-3"
        >
          <OrganizationBadge :short-name="organization.shortName" />
          <RouterLink
            :to="{ name: 'organization', params: { slug: organization.slug } }"
            class="font-semibold hover:underline"
          >
            {{ organization.name }}
          </RouterLink>
          <span class="rounded-pill border border-line px-3 py-1 text-sm text-muted">
            {{ $t('orgs.member') }}
          </span>
        </li>
      </ul>
    </section>

    <section class="flex flex-col gap-4" aria-labelledby="all-organizations-title">
      <div>
        <h2 id="all-organizations-title" class="font-display text-xl font-semibold">
          {{ $t('orgs.all') }} {{ total }}
        </h2>
        <p class="text-sm text-muted">{{ $t('orgs.allHint') }}</p>
      </div>
      <QueryState :loading="list.isPending.value" :error="list.error.value" @retry="list.refetch()">
        <template #skeleton>
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <OrganizationCardSkeleton v-for="card in 6" :key="card" />
          </div>
        </template>
        <StatePanel
          v-if="organizations.length === 0"
          kind="communityEmpty"
          :title="$t('orgs.empty')"
        />
        <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <OrganizationCard
            v-for="organization in organizations"
            :key="organization.id"
            :organization="organization"
          />
        </div>
      </QueryState>
      <NumberedPager
        v-if="list.data.value"
        :meta="list.data.value.meta"
        :label="$t('orgs.pager')"
      />
    </section>
  </div>
</template>
