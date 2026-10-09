<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import { kickMember } from '@/api/organizations-admin.api';
import type { OrganizationMember } from '@/api/types/organizations';
import { useMembersQuery } from '@/features/organizations/organizations.queries';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import { pageFromQuery } from '@/lib/paging';
import AdminStatus from '../ui/AdminStatus.vue';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { failureTextOf } from '../ui/admin-errors';
import { ADMIN_DANGER_CLASS } from '../ui/classes';
import { useOrganizationWrite } from './organization-write';

const MEMBERS_PAGE_SIZE = 50;
const props = defineProps<{ slug: string }>();
const route = useRoute();
const page = computed(() => pageFromQuery(route.query.members));
const members = useMembersQuery(
  () => props.slug,
  () => ({ sort: 'performancePoints', page: page.value, pageSize: MEMBERS_PAGE_SIZE }),
);

const isDialogOpen = ref(false);
const target = ref<OrganizationMember | null>(null);
const kick = useOrganizationWrite<OrganizationMember, void>({
  mutate: (member) => kickMember(props.slug, member.id),
  invalidates: () => [
    ['organizations', 'members', props.slug],
    ['organizations', 'detail', props.slug],
  ],
});

const rows = computed(() => members.data.value?.items ?? []);
const count = computed(() => members.data.value?.meta.total ?? rows.value.length);

function askKick(member: OrganizationMember) {
  target.value = member;
  isDialogOpen.value = true;
}

async function confirmKick() {
  if (target.value === null) return;
  const isKicked = await kick.run(target.value);
  if (isKicked) isDialogOpen.value = false;
}
</script>

<template>
  <section>
    <SettingsCard
      :title="$t('admin.organizations.members.title')"
      :lead="$t('admin.organizations.members.count', { count })"
    >
      <ul class="flex flex-col divide-y divide-line">
        <li
          v-for="row in rows"
          :key="row.id"
          class="flex flex-wrap items-center justify-between gap-3 py-2"
        >
          <span class="flex min-w-0 items-center gap-3">
            <span class="w-8 text-sm text-muted">{{ row.rank }}</span>
            <AdminUserLabel :username="row.username" />
          </span>
          <span class="flex items-center gap-3">
            <span class="text-sm text-muted">{{ row.performancePoints }}</span>
            <button type="button" :class="ADMIN_DANGER_CLASS" @click="askKick(row)">
              {{ $t('admin.organizations.members.kick') }}
            </button>
          </span>
        </li>
      </ul>
      <NumberedPager
        v-if="members.data.value"
        :meta="members.data.value.meta"
        :label="$t('admin.organizations.members.pager')"
        query-key="members"
      />
    </SettingsCard>
    <ConfirmDialog
      v-model:visible="isDialogOpen"
      :title="
        $t('admin.organizations.members.kickTitle', {
          username: target?.username ?? '',
          organization: slug,
        })
      "
      :body="$t('admin.organizations.members.kickBody')"
      :confirm-label="$t('admin.organizations.members.kick')"
      tone="danger"
      :busy="kick.isPending.value"
      @confirm="confirmKick"
    >
      <template #error>
        <AdminStatus
          v-if="kick.failure.value"
          kind="refused"
          :text="failureTextOf(kick.failure.value)"
        />
      </template>
    </ConfirmDialog>
  </section>
</template>
