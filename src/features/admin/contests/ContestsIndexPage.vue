<script setup lang="ts">
import { Plus } from 'lucide-vue-next';
import { usePermissions } from '@/stores/use-permissions';
import { ADMIN_SCREENS } from '../admin-screens';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import { buttonClass } from '../ui/controls';
import ContestList from './list/ContestList.vue';

const { canAny } = usePermissions();
</script>

<template>
  <div class="flex flex-col gap-6">
    <AdminPageHeader
      :title="$t('admin.contests.index.title')"
      :lead="$t('admin.contests.index.lead')"
    >
      <template #actions>
        <RouterLink
          v-if="canAny(ADMIN_SCREENS.contestNew.permission)"
          :to="{ name: 'admin-contestNew' }"
          :class="buttonClass('primary')"
        >
          <Plus aria-hidden="true" class="size-4" :stroke-width="1.75" />
          {{ $t('admin.contests.index.create') }}
        </RouterLink>
      </template>
    </AdminPageHeader>
    <ContestList />
  </div>
</template>
