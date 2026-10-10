<script setup lang="ts">
import { computed, ref } from 'vue';
import { ApiError } from '@/api/client';
import { createIntegrationClient } from '@/api/integration-clients.api';
import { INTEGRATION_SCOPES } from '@/api/types/integration-clients';
import type { CreatedIntegrationClient, IntegrationScope } from '@/api/types/integration-clients';
import GlassCard from '@/components/GlassCard.vue';
import { translate } from '@/i18n';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { ADMIN_INPUT_CLASS, ADMIN_PRIMARY_CLASS } from '../ui/classes';
import { fromLocalInput } from '../ui/datetime';
import { useAdminMutation } from '../ui/use-admin-mutation';
import { cidrLines } from './integration-form';
import { integrationClientsKey } from './integration-clients.queries';

/** `isLocked`: impersonating, so the backend would refuse; nothing is sent. */
const props = defineProps<{ isLocked: boolean }>();
const emit = defineEmits<{ created: [client: CreatedIntegrationClient] }>();
/** The message key of each scope box (no colon in the key). */
const SCOPE_KEYS: Record<IntegrationScope, string> = {
  'contests:write': 'contestsWrite',
  'contests:read': 'contestsRead',
};
const name = ref('');
const scopes = ref<IntegrationScope[]>([]);
const cidrs = ref('');
const actsAs = ref('');
const expires = ref('');
const create = useAdminMutation<void, CreatedIntegrationClient>({
  mutate: () =>
    createIntegrationClient({
      name: name.value.trim(),
      scopes: [...scopes.value],
      allowedCidrs: cidrLines(cidrs.value),
      actsAs: actsAs.value.trim(),
      expiresAt: fromLocalInput(expires.value) ?? undefined,
    }),
  invalidates: () => [integrationClientsKey],
  onSuccess: (client) => {
    emit('created', client);
  },
  onDone: () => {
    name.value = '';
    scopes.value = [];
    cidrs.value = '';
    actsAs.value = '';
    expires.value = '';
  },
});
/** The backend raises `invalid` with an English message: the SPA text by (field, code); other codes go through `adminIssueText` (`fieldErrors`). */
function refusedText(field: string, refusedKey: string): string | undefined {
  const failure = create.failure.value;
  const isRefused =
    failure instanceof ApiError &&
    failure.issues.some((item) => item.field === field && item.code === 'invalid');
  return isRefused ? translate(refusedKey) : create.fieldErrors.value[field];
}
const pageFailure = computed(() =>
  create.failure.value && Object.keys(create.fieldErrors.value).length === 0
    ? failureTextOf(create.failure.value)
    : null,
);
function submit() {
  if (!props.isLocked) void create.run();
}
</script>

<template>
  <GlassCard as="div" class="rounded-panel p-5 sm:p-6">
    <form
      data-testid="integration-form"
      class="flex flex-col gap-4"
      novalidate
      @submit.prevent="submit"
    >
      <h2 class="font-display text-base font-bold">{{ $t('admin.integrations.form.title') }}</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <AdminField
          v-slot="{ id, describedBy, invalid }"
          input-id="integration-name"
          :label="$t('admin.integrations.form.name')"
          :error="create.fieldErrors.value.name"
        >
          <input
            :id="id"
            v-model="name"
            type="text"
            maxlength="60"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
            :class="ADMIN_INPUT_CLASS"
          />
        </AdminField>
        <AdminField
          v-slot="{ id, describedBy, invalid }"
          input-id="integration-acts-as"
          :label="$t('admin.integrations.form.actsAs')"
          :hint="$t('admin.integrations.form.actsAsHint')"
          :error="refusedText('actsAs', 'admin.integrations.form.actsAsRefused')"
        >
          <input
            :id="id"
            v-model="actsAs"
            type="text"
            autocapitalize="off"
            spellcheck="false"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
            :class="ADMIN_INPUT_CLASS"
          />
        </AdminField>
      </div>
      <fieldset class="flex flex-col gap-2">
        <legend class="mb-1 text-sm font-semibold">
          {{ $t('admin.integrations.form.scopes') }}
        </legend>
        <label
          v-for="scope in INTEGRATION_SCOPES"
          :key="scope"
          class="flex min-h-11 items-center gap-3"
        >
          <input v-model="scopes" type="checkbox" class="size-5" :value="scope" />
          <span
            ><code class="font-mono text-sm">{{ scope }}</code> ·
            {{ $t(`admin.integrations.form.scope.${SCOPE_KEYS[scope]}`) }}</span
          >
        </label>
        <p v-if="create.fieldErrors.value.scopes" class="text-sm text-negative">
          {{ create.fieldErrors.value.scopes }}
        </p>
      </fieldset>
      <AdminField
        v-slot="{ id, describedBy, invalid }"
        input-id="integration-cidrs"
        :label="$t('admin.integrations.form.cidrs')"
        :hint="$t('admin.integrations.form.cidrsHint')"
        :error="refusedText('allowedCidrs', 'admin.integrations.form.cidrRefused')"
      >
        <textarea
          :id="id"
          v-model="cidrs"
          rows="3"
          spellcheck="false"
          :aria-describedby="describedBy"
          :aria-invalid="invalid ? 'true' : undefined"
          :class="`${ADMIN_INPUT_CLASS} py-2 font-mono`"
        />
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy, invalid }"
        input-id="integration-expires"
        :label="$t('admin.integrations.form.expires')"
        :hint="$t('admin.integrations.form.expiresHint')"
        :error="refusedText('expiresAt', 'admin.integrations.form.expiresRefused')"
      >
        <input
          :id="id"
          v-model="expires"
          type="datetime-local"
          :aria-describedby="describedBy"
          :aria-invalid="invalid ? 'true' : undefined"
          :class="ADMIN_INPUT_CLASS"
        />
      </AdminField>
      <div>
        <button
          type="submit"
          :class="ADMIN_PRIMARY_CLASS"
          :aria-disabled="isLocked || create.isPending.value || undefined"
        >
          {{ $t('admin.integrations.form.submit') }}
        </button>
      </div>
      <AdminStatus v-if="pageFailure" kind="refused" :text="pageFailure" />
    </form>
  </GlassCard>
</template>
