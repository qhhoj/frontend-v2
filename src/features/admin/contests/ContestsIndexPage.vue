<script setup lang="ts">
import { useRouter } from 'vue-router';
import { usePermissions } from '@/stores/use-permissions';
import { ADMIN_SCREENS } from '../admin-screens';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import ExactLookup from '../ui/ExactLookup.vue';
import ContestSearchList from '../search/ContestSearchList.vue';

const router = useRouter();
const { canAny } = usePermissions();
const openContest = (key: string) => router.push({ name: 'admin-contestGeneral', params: { key } });
</script>

<template>
  <div class="flex flex-col gap-6">
    <AdminPageHeader
      :crumbs="[{ label: $t('admin.contests.crumb') }]"
      :title="$t('admin.contests.index.title')"
      :lead="$t('admin.contests.index.lead')"
    >
      <template #actions>
        <RouterLink
          v-if="canAny(ADMIN_SCREENS.contestNew.permission)"
          :to="{ name: 'admin-contestNew' }"
          class="inline-flex min-h-11 items-center rounded-pill bg-gradient-accent px-5 font-semibold text-on-accent"
        >
          {{ $t('admin.contests.index.create') }}
        </RouterLink>
      </template>
    </AdminPageHeader>
    <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
      <section class="glass rounded-panel p-5">
        <ExactLookup
          :label="$t('admin.contests.index.lookupLabel')"
          :submit-label="$t('admin.contests.index.openLabel')"
          :hint="$t('admin.contests.index.lookupHint')"
          @open="openContest"
        />
      </section>
      <ContestSearchList />
    </div>
  </div>
</template>
