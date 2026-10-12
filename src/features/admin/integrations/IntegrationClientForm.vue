<script setup lang="ts">
import { computed, ref } from 'vue';
import { ApiError } from '@/api/client';
import { createIntegrationClient } from '@/api/integration-clients.api';
import { INTEGRATION_SCOPES } from '@/api/types/integration-clients';
import type { CreatedIntegrationClient, IntegrationScope } from '@/api/types/integration-clients';
import { translate } from '@/i18n';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { BUTTON, INPUT } from '../ui/controls';
import AdminDateTimeField from '../ui/form/AdminDateTimeField.vue';
import AdminSaveBar from '../ui/form/AdminSaveBar.vue';
import { useAdminMutation } from '../ui/use-admin-mutation';
import { SCOPE_KEYS, cidrLines } from './integration-form';
import { integrationClientsKey } from './integration-clients.queries';

/** `isLocked`: impersonating, so the backend would refuse; nothing is sent. */
const props = defineProps<{ isLocked: boolean }>();
const emit = defineEmits<{ created: [client: CreatedIntegrationClient]; cancel: [] }>();
const name = ref('');
const scopes = ref<IntegrationScope[]>([]);
const cidrs = ref('');
const actsAs = ref('');
/** An ISO instant, or null for a key that lasts until revoked. */
const expires = ref<string | null>(null);
const create = useAdminMutation<void, CreatedIntegrationClient>({
  mutate: () =>
    createIntegrationClient({
      name: name.value.trim(),
      scopes: [...scopes.value],
      allowedCidrs: cidrLines(cidrs.value),
      actsAs: actsAs.value.trim(),
      expiresAt: expires.value ?? undefined,
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
    expires.value = null;
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
  <form
    data-testid="integration-form"
    class="flex flex-col gap-4"
    novalidate
    @submit.prevent="submit"
  >
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
          :class="INPUT"
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
          :class="INPUT"
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
        class="flex min-h-[var(--qa-control,2.25rem)] items-start gap-3 py-1"
      >
        <input
          v-model="scopes"
          type="checkbox"
          class="mt-0.5 size-4 accent-[var(--qh-accent)]"
          :value="scope"
        />
        <span class="flex flex-col">
          <span>{{ $t(`admin.integrations.form.scope.${SCOPE_KEYS[scope]}`) }}</span>
          <code class="font-mono text-xs text-muted">{{ scope }}</code>
        </span>
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
        :class="`${INPUT} py-2 font-mono`"
      />
    </AdminField>
    <AdminDateTimeField
      v-model="expires"
      input-id="integration-expires"
      :label="$t('admin.integrations.form.expires')"
      :hint="$t('admin.integrations.form.expiresHint')"
      :error="refusedText('expiresAt', 'admin.integrations.form.expiresRefused')"
    />
    <AdminStatus v-if="pageFailure" kind="refused" :text="pageFailure" />
    <div class="flex border-t border-line pt-4">
      <AdminSaveBar
        variant="footer"
        allow-clean
        :dirty-count="0"
        :pending="create.isPending.value"
        :blocked-reason="isLocked ? $t('admin.integrations.impersonating') : undefined"
        :save-label="$t('admin.integrations.form.submit')"
      >
        <template #actions>
          <button type="button" :class="BUTTON.ghost" @click="emit('cancel')">
            {{ $t('admin.integrations.form.cancel') }}
          </button>
        </template>
      </AdminSaveBar>
    </div>
  </form>
</template>
