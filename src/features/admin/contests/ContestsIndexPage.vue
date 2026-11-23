<script setup lang="ts">
import { Plus } from 'lucide-vue-next';
import { computed } from 'vue';
import { usePermissions } from '@/stores/use-permissions';
import { ADMIN_SCREENS } from '../admin-screens';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import { buttonClass } from '../ui/controls';
import ContestList from './list/ContestList.vue';

const { can, canAny } = usePermissions();
/** As on the problem list: an account that edits every contest sees the whole site here, so the page is not called "mine". */
const titleKey = computed(() =>
  can('judge.edit_all_contest') ? 'admin.contests.index.title' : 'admin.contests.index.titleOwn',
);
</script>

<template>
  <div class="flex flex-col gap-6">
    <AdminPageHeader :title="$t(titleKey)" :lead="$t('admin.contests.index.lead')">
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
