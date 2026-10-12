<script setup lang="ts">
import { ShieldCheck, ShieldOff, UserMinus, UserRound } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import { kickMember } from '@/api/organizations-admin.api';
import type { OrganizationMember } from '@/api/types/organizations';
import { useMembersQuery } from '@/features/organizations/organizations.queries';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { pageFromQuery } from '@/lib/paging';
import { useLocaleStore } from '@/stores/locale.store';
import { usePermissions } from '@/stores/use-permissions';
import AdminChip from '../ui/AdminChip.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { failureTextOf } from '../ui/admin-errors';
import { useAdminToast } from '../ui/feedback/use-admin-toast';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import AdminFilterBar from '../ui/table/AdminFilterBar.vue';
import AdminRowMenu from '../ui/table/AdminRowMenu.vue';
import type { RowMenuItem } from '../ui/table/AdminRowMenu.vue';
import { rangeOf } from '../ui/table/table-columns';
import type { AdminColumn } from '../ui/table/table-columns';
import { organizationHistoryKey } from './organization-history.queries';
import { memberSearchOf } from './organization-search';
import { useOrganizationWrite } from './organization-write';
import { useAdminRole } from './use-admin-role';
import type { RoleChange } from './use-admin-role';

const MEMBERS_PAGE_SIZE = 50;
const props = defineProps<{ slug: string }>();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const locale = useLocaleStore();
const toast = useAdminToast();
const { can } = usePermissions();
/** The user admin page needs `judge.ban_user`; others get no link to a screen they cannot open. */
const canOpenUser = computed(() => can('judge.ban_user'));
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
/** Admins cannot be removed (backend `admin_not_kickable`): their rows offer stepping down instead. */
const role = useAdminRole(() => props.slug);
const adminIds = computed(() => new Set(role.adminIds.value));
const canDemote = computed(() => adminIds.value.size > 1);
const roleChange = ref<RoleChange | null>(null);
const isRoleDialogOpen = ref(false);
const roleText = computed(() => {
  const change = roleChange.value;
  const key = change?.makeAdmin ? 'promote' : 'demote';
  const username = change?.member.username ?? '';
  return {
    title: translate(`orgAdmin.members.${key}Title`, { username }),
    body: translate(`orgAdmin.members.${key}Body`),
    confirm: translate(`orgAdmin.members.${key}`),
  };
});

const isDialogOpen = ref(false);
const sectionId = `org-members-${props.slug}`;
const section = ref<HTMLElement | null>(null);
/** The kicked member's row held the opener; the panel is the stable place left. */
const focusPanel = () => section.value;
const target = ref<OrganizationMember | null>(null);
const kick = useOrganizationWrite<OrganizationMember, void>({
  mutate: (member) => kickMember(props.slug, member.id),
  onDone: (_result, member) =>
    void toast.show({
      text: t('admin.organizations.members.kicked', { username: member.username }),
    }),
  invalidates: () => [
    ['organizations', 'members', props.slug],
    ['organizations', 'detail', props.slug],
    organizationHistoryKey(props.slug),
  ],
});

const rows = computed(() => members.data.value?.items ?? []);
const count = computed(() => members.data.value?.meta.total ?? rows.value.length);
const resultText = computed(() =>
  search.value
    ? t('admin.organizations.members.countMatchShort', { count: count.value })
    : t('admin.organizations.members.count', { count: count.value }),
);
const range = computed(() => {
  const meta = members.data.value?.meta;
  return meta ? rangeOf(meta.page, meta.pageSize, rows.value.length, meta.total) : null;
});
const columns = computed<AdminColumn[]>(() => [
  {
    key: 'rank',
    label: t('admin.organizations.members.rank'),
    align: 'end',
    cellClass: 'w-12 whitespace-nowrap',
  },
  {
    key: 'member',
    label: t('admin.organizations.members.title'),
    priority: 'primary',
    cellClass: 'w-full max-w-0',
  },
  { key: 'role', label: t('admin.organizations.members.role'), priority: 'badge' },
  {
    key: 'points',
    label: t('admin.organizations.members.points'),
    align: 'end',
    cellClass: 'whitespace-nowrap',
  },
]);

/** A new search starts again from the first page of members. */
const searchText = computed({
  get: () => search.value,
  set: (text: string) =>
    void router.replace({ query: { ...route.query, mq: text || undefined, members: undefined } }),
});

/** The ⋯ menu: open the user (staff), then the role change, then the remove (members only, last). */
function menuItems(member: OrganizationMember): RowMenuItem[] {
  const isAdmin = adminIds.value.has(member.id);
  const open: RowMenuItem[] = canOpenUser.value
    ? [
        {
          label: t('admin.organizations.members.openUser'),
          icon: UserRound,
          to: { name: 'admin-users', query: { q: member.username } },
        },
      ]
    : [];
  if (isAdmin)
    return [
      ...open,
      {
        label: canDemote.value ? t('orgAdmin.members.demote') : t('orgAdmin.members.lastAdmin'),
        icon: ShieldOff,
        disabled: !canDemote.value,
        run: () => askRole(member, false),
      },
    ];
  return [
    ...open,
    { label: t('orgAdmin.members.promote'), icon: ShieldCheck, run: () => askRole(member, true) },
    {
      label: t('admin.organizations.members.kick'),
      icon: UserMinus,
      danger: true,
      run: () => askKick(member),
    },
  ];
}

function askKick(member: OrganizationMember) {
  kick.reset();
  target.value = member;
  isDialogOpen.value = true;
}

function askRole(member: OrganizationMember, makeAdmin: boolean) {
  role.write.reset();
  roleChange.value = { member, makeAdmin };
  isRoleDialogOpen.value = true;
}

async function confirmRole() {
  if (roleChange.value === null) return;
  const change = roleChange.value;
  if (!(await role.write.run(change))) return;
  isRoleDialogOpen.value = false;
  const key = change.makeAdmin ? 'promoted' : 'demoted';
  toast.show({
    text: t(`admin.organizations.members.${key}`, { username: change.member.username }),
  });
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
    :aria-labelledby="sectionId"
    class="flex min-w-0 flex-col gap-3 focus-visible:outline-none"
  >
    <h3 :id="sectionId" class="font-display text-base font-semibold">
      {{ $t('admin.organizations.members.title') }}
    </h3>
    <AdminFilterBar
      v-model:search="searchText"
      :search-label="$t('admin.organizations.members.search')"
      :result-text="resultText"
    />
    <AdminDataTable
      :columns="columns"
      :rows="rows"
      :row-key="(row: OrganizationMember) => row.id"
      :row-label="(row: OrganizationMember) => row.username"
      :row-attrs="() => ({ 'data-testid': 'member-row' })"
      :label="$t('admin.organizations.members.title')"
      :loading="members.isPending.value"
      :error="members.error.value"
      :filtered="search !== ''"
      :empty-text="$t('admin.organizations.members.empty')"
      :skeleton-rows="5"
      @retry="members.refetch()"
      @clear-filters="searchText = ''"
    >
      <template #cell-rank="{ row }">{{ row.rank }}</template>
      <template #cell-member="{ row }">
        <AdminUserLabel :username="row.username" :rating="row.rating" />
      </template>
      <template #cell-role="{ row }">
        <AdminChip v-if="adminIds.has(row.id)" data-testid="admin-chip" tone="accent">{{
          $t('admin.organizations.members.admin')
        }}</AdminChip>
      </template>
      <template #cell-points="{ row }">{{
        formatNumber(row.performancePoints, locale.locale)
      }}</template>
      <template #actions="{ row }">
        <span data-testid="member-actions" class="contents">
          <AdminRowMenu
            :label="$t('orgAdmin.members.actionsNamed', { username: row.username })"
            :items="menuItems(row)"
          />
        </span>
      </template>
      <template v-if="members.data.value" #footer>
        <span v-if="range" class="font-mono tabular-nums">{{
          $t('admin.table.range', range)
        }}</span>
        <NumberedPager
          class="ml-auto"
          compact
          :meta="members.data.value.meta"
          :label="$t('admin.organizations.members.pager')"
          query-key="members"
        />
      </template>
    </AdminDataTable>
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
    <ConfirmDialog
      v-model:visible="isRoleDialogOpen"
      :return-focus-to="focusPanel"
      :title="roleText.title"
      :body="roleText.body"
      :confirm-label="roleText.confirm"
      :busy="role.write.isPending.value"
      @confirm="confirmRole"
    >
      <template #error>
        <AdminStatus
          v-if="role.write.failure.value"
          kind="refused"
          :text="failureTextOf(role.write.failure.value)"
        />
      </template>
    </ConfirmDialog>
  </section>
</template>
