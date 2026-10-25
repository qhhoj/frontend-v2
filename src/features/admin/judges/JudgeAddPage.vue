<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createJudge } from '@/api/judges-admin.api';
import type { Judge } from '@/api/types/judges-admin';
import { useI18n } from 'vue-i18n';
import AdminField from '../ui/AdminField.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf, hasIssueCode } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import { CARD, INPUT, buttonClass } from '../ui/controls';
import AdminSaveBar from '../ui/form/AdminSaveBar.vue';
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

/** The backend answers a taken name with 409 and issue code `name_taken`; the page names it in the SPA's words. */
const isNameTaken = computed(() => hasIssueCode(create.failure.value, 'name_taken'));
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
  <div class="flex flex-col gap-5">
    <AdminPageHeader :title="$t('admin.judges.add.title')" />
    <form class="flex flex-col gap-5" @submit.prevent="submit">
      <div :class="[CARD, 'flex max-w-[55rem] flex-col gap-5 p-5']">
        <AdminField
          v-slot="{ id, describedBy, invalid }"
          :label="$t('admin.judges.add.nameLabel')"
          input-id="judge-name"
          required
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
            :class="INPUT"
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
            :class="INPUT"
          />
        </AdminField>
        <AdminStatus v-if="pageFailure" kind="refused" :text="pageFailure" />
      </div>
      <AdminSaveBar
        allow-clean
        :dirty-count="0"
        :pending="create.isPending.value"
        :save-label="$t('admin.judges.add.submit')"
      >
        <template #actions>
          <RouterLink :to="{ name: 'admin-judges' }" :class="buttonClass('ghost')">
            {{ $t('common.cancel') }}
          </RouterLink>
        </template>
      </AdminSaveBar>
    </form>
    <JudgeKeyDialog
      :visible="revealedKey !== null"
      :header="$t('admin.judges.key.createdTitle')"
      :auth-key="revealedKey ?? ''"
      @close="leaveAfterKey"
    />
  </div>
</template>
