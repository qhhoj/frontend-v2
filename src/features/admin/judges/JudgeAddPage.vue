<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createJudge } from '@/api/judges-admin.api';
import type { Judge } from '@/api/types/judges-admin';
import { ApiError } from '@/api/client';
import { useI18n } from 'vue-i18n';
import AdminField from '../ui/AdminField.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import { ADMIN_BUTTON_CLASS, ADMIN_INPUT_CLASS, ADMIN_PRIMARY_CLASS } from '../ui/classes';
import JudgeKeyDialog from './JudgeKeyDialog.vue';
import { JUDGE_DESCRIPTION_MAX, JUDGE_NAME_PATTERN, trimmedDescription } from './judge-stats';
import { useJudgesCache } from './judges.queries';

const { t } = useI18n();
const router = useRouter();
const cache = useJudgesCache();
const name = ref('');
const description = ref('');
const clientNameError = ref<string | null>(null);
const clientDescriptionError = ref<string | null>(null);
const revealedKey = ref<string | null>(null);

const create = useAdminMutation<
  { name: string; description?: string },
  { judge: Judge; authKey: string }
>({
  mutate: (body) => createJudge(body),
  onDone: ({ judge }) => cache.add(judge),
});

/** The backend answers a taken name with 409 `conflict` and `fields.name`; the page names it in the SPA's words. */
const isNameTaken = computed(() => {
  const failure = create.failure.value;
  return failure instanceof ApiError && failure.code === 'conflict' && 'name' in failure.fields;
});
const nameError = computed(() => {
  if (clientNameError.value) return clientNameError.value;
  return isNameTaken.value ? t('admin.judges.add.nameTaken') : null;
});
const pageFailure = computed(() =>
  create.failure.value && !isNameTaken.value ? failureTextOf(create.failure.value) : null,
);

async function submit() {
  clientNameError.value = JUDGE_NAME_PATTERN.test(name.value)
    ? null
    : t('admin.judges.add.nameInvalid');
  clientDescriptionError.value =
    description.value.length > JUDGE_DESCRIPTION_MAX
      ? t('admin.judges.add.descriptionTooLong')
      : null;
  if (clientNameError.value || clientDescriptionError.value) return;
  const result = await create.run({
    name: name.value,
    description: trimmedDescription(description.value) || undefined,
  });
  if (result) revealedKey.value = result.authKey;
}

function leaveAfterKey() {
  revealedKey.value = null;
  void router.push({ name: 'admin-judges' });
}
</script>

<template>
  <div class="flex flex-col gap-5 px-4 py-6 sm:px-8">
    <AdminPageHeader
      :crumbs="[
        { label: $t('admin.judges.crumbs.group') },
        { label: $t('admin.judges.crumbs.judges'), to: { name: 'admin-judges' } },
        { label: $t('admin.judges.crumbs.add') },
      ]"
      :title="$t('admin.judges.add.title')"
    />
    <form class="glass flex max-w-2xl flex-col gap-5 rounded-panel p-5" @submit.prevent="submit">
      <AdminField
        v-slot="{ id, describedBy, invalid }"
        :label="$t('admin.judges.add.nameLabel')"
        input-id="judge-name"
        :hint="$t('admin.judges.add.nameHint')"
        :error="nameError ?? undefined"
      >
        <input
          :id="id"
          v-model="name"
          type="text"
          autocomplete="off"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
          :class="ADMIN_INPUT_CLASS"
        />
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy }"
        :label="$t('admin.judges.add.descriptionLabel')"
        input-id="judge-description"
        :hint="$t('admin.judges.add.descriptionHint')"
        :error="clientDescriptionError ?? undefined"
      >
        <textarea
          :id="id"
          v-model="description"
          rows="3"
          :aria-describedby="describedBy"
          :class="ADMIN_INPUT_CLASS"
        />
      </AdminField>
      <AdminStatus v-if="pageFailure" kind="refused" :text="pageFailure" />
      <div class="flex flex-wrap gap-3">
        <RouterLink :to="{ name: 'admin-judges' }" :class="ADMIN_BUTTON_CLASS">
          {{ $t('admin.judges.add.cancel') }}
        </RouterLink>
        <button
          type="submit"
          :class="ADMIN_PRIMARY_CLASS"
          :aria-busy="create.isPending.value || undefined"
        >
          {{ $t('admin.judges.add.submit') }}
        </button>
      </div>
    </form>
    <JudgeKeyDialog
      :visible="revealedKey !== null"
      :header="$t('admin.judges.key.createdTitle')"
      :auth-key="revealedKey ?? ''"
      @close="leaveAfterKey"
    />
  </div>
</template>
