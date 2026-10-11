<script setup lang="ts">
import { ChevronLeft, EyeOff, X } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { OrganizationDetail } from '@/api/types/organizations';
import { useOrganizationQuery } from '@/features/organizations/organizations.queries';
import { usePermissions } from '@/stores/use-permissions';
import AdminChip from '../ui/AdminChip.vue';
import AdminTabs from '../ui/AdminTabs.vue';
import type { AdminTab } from '../ui/AdminTabs.vue';
import { buttonClass, iconButtonClass } from '../ui/controls';
import JoinRequestsPanel from './JoinRequestsPanel.vue';
import MembersPanel from './MembersPanel.vue';
import OrganizationDeleteCard from './OrganizationDeleteCard.vue';
import OrganizationEditor from './OrganizationEditor.vue';
import OrganizationHistoryPanel from './OrganizationHistoryPanel.vue';
import { organizationPanelOf } from './organization-search';
import type { OrganizationPanel } from './organization-search';

/**
 * One organization beside the list (or alone below 1280 px): its name and state, then the tabs Thông tin · Thành viên ·
 * Yêu cầu · Lịch sử (`?panel=`). A create (`slug` null) is the form alone. Members, requests and history are administrators'
 * views: the backend answers others with 403, so their tabs are left out.
 */
const props = defineProps<{
  slug: string | null;
  /** Leaves the deleted organization; awaited before the organization queries refresh. */
  onDeleted: () => Promise<unknown>;
}>();
const emit = defineEmits<{ saved: [organization: OrganizationDetail]; close: [] }>();
const route = useRoute();
const { isSuperuser } = usePermissions();
/** The page keys this view by organization, so `slug` never changes inside one instance. */
const detail = props.slug === null ? null : useOrganizationQuery(props.slug);
const organization = computed(() => detail?.data.value);
const canAdminister = computed(() => organization.value?.viewer?.canAdminister === true);
const panel = computed<OrganizationPanel>(() =>
  canAdminister.value ? organizationPanelOf(route.query) : 'info',
);
const PANELS: { key: OrganizationPanel; labelKey: string }[] = [
  { key: 'info', labelKey: 'admin.organizations.panels.info' },
  { key: 'members', labelKey: 'admin.organizations.panels.members' },
  { key: 'requests', labelKey: 'admin.organizations.panels.requests' },
  { key: 'history', labelKey: 'admin.organizations.panels.history' },
];
const tabs = computed<AdminTab[]>(() =>
  PANELS.map((item) => ({
    ...item,
    to: { query: { ...route.query, panel: item.key === 'info' ? undefined : item.key } },
  })),
);
</script>

<template>
  <section
    data-testid="org-detail"
    :aria-label="organization?.name ?? $t('admin.organizations.editor.createTitle')"
    class="flex min-w-0 flex-col gap-4"
  >
    <header class="flex flex-col items-start gap-1">
      <button
        type="button"
        :class="[buttonClass('ghost', 'sm'), '-ml-2.5 xl:hidden']"
        @click="emit('close')"
      >
        <ChevronLeft aria-hidden="true" class="size-4" :stroke-width="1.75" />
        {{ $t('admin.organizations.detail.back') }}
      </button>
      <div class="flex w-full items-start gap-3">
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <h2 class="font-display text-xl leading-tight font-semibold break-words">
            {{
              organization?.name ??
              (slug === null ? $t('admin.organizations.editor.createTitle') : slug)
            }}
          </h2>
          <p v-if="organization" class="m-0 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span class="font-mono">{{ organization.slug }}</span>
            <AdminChip :tone="organization.isOpen ? 'positive' : 'neutral'">{{
              $t(
                organization.isOpen
                  ? 'admin.organizations.list.open'
                  : 'admin.organizations.list.closed',
              )
            }}</AdminChip>
            <AdminChip v-if="organization.isUnlisted" :icon="EyeOff">{{
              $t('admin.organizations.list.hidden')
            }}</AdminChip>
          </p>
        </div>
        <button
          type="button"
          :class="[iconButtonClass('ghost', 'sm'), 'max-xl:hidden']"
          :aria-label="$t('admin.organizations.detail.close')"
          :title="$t('admin.organizations.detail.close')"
          @click="emit('close')"
        >
          <X aria-hidden="true" class="size-4" :stroke-width="1.75" />
        </button>
      </div>
    </header>
    <AdminTabs
      v-if="canAdminister"
      :tabs="tabs"
      :current="panel"
      :label="$t('admin.organizations.panels.label')"
    />
    <template v-if="panel === 'info'">
      <OrganizationEditor :key="slug ?? 'new'" :slug="slug" @saved="emit('saved', $event)" />
      <OrganizationDeleteCard
        v-if="isSuperuser && slug !== null"
        :key="`delete-${slug}`"
        :slug="slug"
        :on-deleted="onDeleted"
      />
    </template>
    <MembersPanel v-else-if="panel === 'members'" :key="`members-${slug}`" :slug="slug!" />
    <JoinRequestsPanel v-else-if="panel === 'requests'" :key="`requests-${slug}`" :slug="slug!" />
    <OrganizationHistoryPanel v-else :key="`history-${slug}`" :slug="slug!" />
  </section>
</template>
