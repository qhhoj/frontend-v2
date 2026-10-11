<script setup lang="ts">
import { computed, ref } from 'vue';
import { onBeforeRouteLeave, useRoute } from 'vue-router';
import { revokeIntegrationClient } from '@/api/integration-clients.api';
import type { CreatedIntegrationClient, IntegrationClient } from '@/api/types/integration-clients';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { translate } from '@/i18n';
import { useSessionStore } from '@/stores/session.store';
import AdminBit from '../shell/AdminBit.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminDrawer from '../ui/AdminDrawer.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { BUTTON } from '../ui/controls';
import AdminNotice from '../ui/feedback/AdminNotice.vue';
import RevealKeyDialog from '../ui/RevealKeyDialog.vue';
import { failureTextOf } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import IntegrationClientForm from './IntegrationClientForm.vue';
import IntegrationClientsTable from './IntegrationClientsTable.vue';
import { integrationClientsKey, useIntegrationClientsQuery } from './integration-clients.queries';

const route = useRoute();
const session = useSessionStore();
/** Minting is session-only and never impersonated (backend `@NoImpersonation()`): lock the screen's writes. */
const isLocked = computed(() => session.impersonatorId !== null);
const page = computed(() => Math.max(1, Number(route.query.page) || 1));
const { data, isPending, error, refetch } = useIntegrationClientsQuery(page);
const clients = computed(() => data.value?.items ?? []);
/** The key shown once lives here, outside QueryState, so a refetch cannot unmount it; dropped on close and on leave. */
const revealed = ref<CreatedIntegrationClient | null>(null);
onBeforeRouteLeave(() => {
  revealed.value = null;
});
const keyTexts = computed(() => ({
  warning: translate('admin.integrations.key.warning'),
  label: translate('admin.integrations.key.label'),
  saved: translate('admin.integrations.key.saved'),
  close: translate('admin.integrations.key.close'),
  copy: translate('admin.integrations.key.copy'),
}));
const pending = ref<IntegrationClient | null>(null);
const revoke = useAdminMutation<IntegrationClient, void>({
  mutate: (client) => revokeIntegrationClient(client.id),
  invalidates: () => [integrationClientsKey],
  successText: (_result, client) => translate('admin.integrations.revoked', { name: client.name }),
  onDone: () => {
    pending.value = null;
  },
});
const isConfirmOpen = computed({
  get: () => pending.value !== null,
  set: (isOpen: boolean) => {
    if (!isOpen) pending.value = null;
  },
});
function askToRevoke(client: IntegrationClient) {
  revoke.reset();
  pending.value = client;
}
const confirmRevoke = () => pending.value && void revoke.run(pending.value);
const tableRegion = () => document.getElementById('integration-table');
/**
 * The create form lives in a drawer. A minted key closes it; the reveal-once dialog opens once the drawer has gone, so the
 * drawer's focus return does not pull focus out of the dialog.
 */
const isCreateOpen = ref(false);
let minted: CreatedIntegrationClient | null = null;
function onCreated(client: CreatedIntegrationClient) {
  minted = client;
  isCreateOpen.value = false;
}
function onDrawerHidden() {
  revealed.value = minted;
  minted = null;
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <AdminPageHeader
      :title="$t('admin.shell.screens.integrations')"
      :lead="$t('admin.integrations.lead')"
    >
      <template #actions>
        <button
          type="button"
          data-testid="integration-create"
          :class="BUTTON.primary"
          :aria-disabled="isLocked || undefined"
          @click="isLocked || (isCreateOpen = true)"
        >
          {{ $t('admin.integrations.add') }}
        </button>
      </template>
    </AdminPageHeader>
    <div v-if="isLocked" role="status">
      <AdminNotice tone="caution" :title="$t('admin.integrations.impersonating')" />
    </div>
    <IntegrationClientsTable
      :clients="clients"
      :meta="data?.meta"
      :is-locked="isLocked"
      :loading="isPending"
      :error="error"
      @revoke="askToRevoke"
      @retry="refetch()"
    >
      <template #empty>
        <div class="flex flex-col items-center gap-3 p-6 text-center">
          <AdminBit placement="empty" />
          <p>{{ $t('admin.integrations.table.empty') }}</p>
        </div>
      </template>
    </IntegrationClientsTable>
    <AdminDrawer
      v-model:visible="isCreateOpen"
      :title="$t('admin.integrations.form.title')"
      @hide="onDrawerHidden"
    >
      <IntegrationClientForm
        :is-locked="isLocked"
        @created="onCreated"
        @cancel="isCreateOpen = false"
      />
    </AdminDrawer>
    <ConfirmDialog
      v-model:visible="isConfirmOpen"
      tone="danger"
      :title="$t('admin.integrations.confirm.title', { name: pending?.name ?? '' })"
      :body="$t('admin.integrations.confirm.body')"
      :confirm-label="$t('admin.integrations.confirm.confirm')"
      :busy="revoke.isPending.value"
      :return-focus-to="tableRegion"
      @confirm="confirmRevoke"
    >
      <template #error>
        <AdminStatus
          v-if="revoke.failure.value"
          kind="refused"
          :text="failureTextOf(revoke.failure.value)"
        />
      </template>
    </ConfirmDialog>
    <RevealKeyDialog
      :visible="revealed !== null"
      :header="$t('admin.integrations.key.title', { name: revealed?.name ?? '' })"
      :auth-key="revealed?.key ?? ''"
      :texts="keyTexts"
      @close="revealed = null"
    />
  </div>
</template>
