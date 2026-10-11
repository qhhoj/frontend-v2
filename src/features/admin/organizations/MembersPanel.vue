<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import { kickMember } from '@/api/organizations-admin.api';
import type { OrganizationMember } from '@/api/types/organizations';
import {
  useMembersQuery,
  useOrganizationQuery,
} from '@/features/organizations/organizations.queries';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import { pageFromQuery } from '@/lib/paging';
import IndexSearchBox from '../search/IndexSearchBox.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import MemberAdminRow from './MemberAdminRow.vue';
import { organizationHistoryKey } from './organization-history.queries';
import { memberSearchOf } from './organization-search';
import { useOrganizationWrite } from './organization-write';

const MEMBERS_PAGE_SIZE = 50;
const props = defineProps<{ slug: string }>();
const route = useRoute();
const router = useRouter();
const page = computed(() => pageFromQuery(route.query.members));
const search = computed(() => memberSearchOf(route.query));
const members = useMembersQuery(
  () => props.slug,
  () => ({
    sort: 'performancePoints',
    page: page.value,
    pageSize: MEMBERS_PAGE_SIZE,
    ...(search.value ? { search: search.value } : {}),
  }),
);
const detail = useOrganizationQuery(() => props.slug);
/** Admins cannot be removed (backend `admin_not_kickable`): their rows say so instead of offering the button. */
const adminIds = computed(() => new Set(detail.data.value?.admins.map((admin) => admin.id) ?? []));

const isDialogOpen = ref(false);
const section = ref<HTMLElement | null>(null);
/** The kicked member's row held the opener; the panel is the stable place left. */
const focusPanel = () => section.value;
const target = ref<OrganizationMember | null>(null);
const kick = useOrganizationWrite<OrganizationMember, void>({
  mutate: (member) => kickMember(props.slug, member.id),
  invalidates: () => [
    ['organizations', 'members', props.slug],
    ['organizations', 'detail', props.slug],
    organizationHistoryKey(props.slug),
  ],
});

const rows = computed(() => members.data.value?.items ?? []);
const count = computed(() => members.data.value?.meta.total ?? rows.value.length);
const lead = computed(() =>
  search.value
    ? {
        key: 'admin.organizations.members.countMatch',
        params: { count: count.value, search: search.value },
      }
    : { key: 'admin.organizations.members.count', params: { count: count.value } },
);

/** A new search starts again from the first page of members. */
function searchFor(text: string) {
  void router.replace({ query: { ...route.query, mq: text || undefined, members: undefined } });
}

function askKick(member: OrganizationMember) {
  kick.reset();
  target.value = member;
  isDialogOpen.value = true;
}

async function confirmKick() {
  if (target.value === null) return;
  const isKicked = await kick.run(target.value);
  if (!isKicked) return;
  isDialogOpen.value = false;
}
</script>

<template>
  <section
    ref="section"
    tabindex="-1"
    :aria-label="$t('admin.organizations.members.title')"
    class="focus-visible:outline-none"
  >
    <SettingsCard
      :title="$t('admin.organizations.members.title')"
      :lead="$t(lead.key, lead.params)"
    >
      <IndexSearchBox
        :value="search"
        :label="$t('admin.organizations.members.search')"
        :placeholder="$t('admin.organizations.members.searchPlaceholder')"
        :clear-label="$t('admin.search.clear')"
        @commit="searchFor"
      />
      <ul v-if="rows.length > 0" class="flex flex-col divide-y divide-line">
        <MemberAdminRow
          v-for="row in rows"
          :key="row.id"
          :member="row"
          :is-admin="adminIds.has(row.id)"
          @kick="askKick(row)"
        />
      </ul>
      <p v-else class="text-sm text-muted">
        {{
          search
            ? $t('admin.organizations.members.emptySearch', { search })
            : $t('admin.organizations.members.empty')
        }}
      </p>
      <NumberedPager
        v-if="members.data.value"
        :meta="members.data.value.meta"
        :label="$t('admin.organizations.members.pager')"
        query-key="members"
      />
    </SettingsCard>
    <ConfirmDialog
      v-model:visible="isDialogOpen"
      :return-focus-to="focusPanel"
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
