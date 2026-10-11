<script setup lang="ts">
import Dialog from 'primevue/dialog';
import { computed, ref } from 'vue';
import type { OrganizationChip } from '@/api/types/admin-common';
import type { CreatedUser, NewUserRow } from '@/api/types/users-admin';
import { createUsers, USER_CREATE_BATCH } from '@/api/users-admin.api';
import { failureTextOf } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import AdminStatus from '../ui/AdminStatus.vue';
import OrganizationChips from '../ui/OrganizationChips.vue';
import UploadButton from '../ui/UploadButton.vue';
import { ADMIN_BUTTON_CLASS, ADMIN_PRIMARY_CLASS } from '../ui/classes';
import CreatedUsersTable from './CreatedUsersTable.vue';
import NewUserFields from './NewUserFields.vue';
import { parseUserCsv, resultsCsv } from './user-csv';

/** Legacy admin "add user" and `batchadduser`: one account, or a CSV sent in requests of 100 rows. */
const visible = defineModel<boolean>('visible', { required: true });
const mode = ref<'single' | 'csv'>('single');
const single = ref<NewUserRow>({ username: '' });
const csvText = ref('');
const organization = ref<OrganizationChip[]>([]);
const results = ref<CreatedUser[]>([]);
const parsed = computed(() => parseUserCsv(csvText.value));
const rows = computed(() => (mode.value === 'single' ? [single.value] : parsed.value.rows));
const canSubmit = computed(
  () => rows.value.length > 0 && rows.value.every((row) => row.username.trim() !== ''),
);

/** Requests run one after another, so the results keep the file's order. */
async function sendAll(all: NewUserRow[]): Promise<CreatedUser[]> {
  const organizationId = organization.value[0]?.id;
  const done: CreatedUser[] = [];
  for (let start = 0; start < all.length; start += USER_CREATE_BATCH)
    done.push(
      ...(await createUsers({
        users: all.slice(start, start + USER_CREATE_BATCH),
        organizationId,
      })),
    );
  return done;
}
const create = useAdminMutation({
  mutate: sendAll,
  invalidates: () => [['admin', 'users']],
  onSuccess: (created) => {
    results.value = created;
  },
});
const refusal = computed(() => (create.failure.value ? failureTextOf(create.failure.value) : null));
const createdCount = computed(() => results.value.filter((row) => row.status === 'created').length);

const readFile = async (file: File) => {
  csvText.value = await file.text();
};
function download() {
  const url = URL.createObjectURL(new Blob([resultsCsv(results.value)], { type: 'text/csv' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: 'accounts.csv' });
  link.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :draggable="false"
    :style="{ width: '760px', maxWidth: 'calc(100vw - 2rem)' }"
    :close-button-props="{ 'aria-label': $t('common.close') }"
  >
    <template #header>
      <h2 class="font-display text-lg font-semibold">{{ $t('admin.users.create.title') }}</h2>
    </template>
    <form class="flex flex-col gap-5" @submit.prevent="canSubmit && create.run(rows)">
      <fieldset class="flex flex-wrap gap-2">
        <legend class="sr-only">{{ $t('admin.users.create.mode') }}</legend>
        <label
          v-for="option in ['single', 'csv'] as const"
          :key="option"
          class="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border border-line-strong px-4 text-sm font-semibold has-[:checked]:bg-accent-soft has-[:checked]:text-accent-soft-text has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
        >
          <input v-model="mode" type="radio" :value="option" class="sr-only" />
          {{ $t(`admin.users.create.modes.${option}`) }}
        </label>
      </fieldset>
      <NewUserFields v-if="mode === 'single'" v-model="single" />
      <div v-else class="flex flex-col gap-3">
        <p class="text-sm text-muted">{{ $t('admin.users.create.csvHint') }}</p>
        <UploadButton
          :label="$t('admin.users.create.pickFile')"
          accept=".csv,text/csv"
          @picked="readFile"
        />
        <label for="create-csv" class="text-sm font-semibold">{{
          $t('admin.users.create.csvLabel')
        }}</label>
        <textarea
          id="create-csv"
          v-model="csvText"
          rows="6"
          spellcheck="false"
          class="w-full rounded-row border border-line-strong bg-surface-solid px-3 py-2 font-mono text-sm text-content"
          placeholder="username,fullname,email,password,invite"
        />
        <p class="text-sm" :class="parsed.problem ? 'text-negative' : 'text-muted'">
          {{
            parsed.problem
              ? $t('admin.users.create.missingUsername')
              : $t('admin.users.create.rowCount', { count: parsed.rows.length })
          }}
        </p>
      </div>
      <OrganizationChips
        v-model="organization"
        :max="1"
        :label="$t('admin.users.create.organization')"
      />
      <button
        type="submit"
        :class="ADMIN_PRIMARY_CLASS"
        class="self-start"
        :aria-disabled="!canSubmit || create.isPending.value || undefined"
        :aria-busy="create.isPending.value || undefined"
      >
        {{ $t('admin.users.create.submit', { count: rows.length }) }}
      </button>
      <AdminStatus v-if="refusal" kind="refused" :text="refusal" />
    </form>
    <section
      v-if="results.length"
      class="mt-6 flex flex-col gap-3"
      :aria-label="$t('admin.users.create.results.caption')"
    >
      <AdminStatus
        kind="security"
        :text="
          $t('admin.users.create.results.summary', { created: createdCount, total: results.length })
        "
      />
      <CreatedUsersTable :results="results" />
      <button type="button" :class="ADMIN_BUTTON_CLASS" class="self-start" @click="download">
        {{ $t('admin.users.create.results.download') }}
      </button>
    </section>
  </Dialog>
</template>
