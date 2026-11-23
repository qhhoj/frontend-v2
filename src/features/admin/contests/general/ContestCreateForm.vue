<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { translate } from '@/i18n';
import { createContest, createOrganizationContest } from '@/api/contest-editing.api';
import type { ContestBody, EditableContest } from '@/api/types/contest-editing';
import AppButton from '@/components/ui/AppButton.vue';
import DateTimeField from '@/components/ui/DateTimeField.vue';
import { provideDateValidity } from '@/components/ui/date-validity';
import FormField from '@/components/ui/FormField.vue';
import Notice from '@/components/ui/Notice.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { usePermissions } from '@/stores/use-permissions';
import CreationOwnerPicker from '../../creation/CreationOwnerPicker.vue';
import type { CreationOwner } from '../../creation/creation-owners';
import type { FieldErrors } from '../../ui/admin-errors';
import { failureTextOf } from '../../ui/admin-errors';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { CONTEST_INDEX_KEY, PUBLIC_CONTESTS_KEY } from '../contest-editing.queries';
import { emptyContestForm } from '../contest-form';
import { checkContestForm, checkContestIdentity } from '../contest-form-checks';
import { toContestBody } from '../contest-patch';
import { QUICK_MINUTES, useContestLength } from './contest-length';
import { timeModel } from './input-values';

/**
 * The create form: owner, key, name, start and end. Format, ranking visibility and everything else are edited in the
 * workbench, which opens on success. An owning organization makes the contest its members-only one (the server sets those
 * fields); every new contest starts hidden. A refusal no field says (the quota, a rule) shows above the button.
 */
const KEY = 'admin.contests.general';
const BENCH = 'admin.contests.workbench.time';
const router = useRouter();
const { can } = usePermissions();
const form = ref(emptyContestForm());
const owner = ref<CreationOwner | null>(null);
const isOwnerReady = ref(false);
const isOwnerBlocked = ref(false);
const start = timeModel(form, 'startTime');
const end = timeModel(form, 'endTime');
const { lastFor, lengthHint } = useContestLength(form);
const { hasUnreadableDate } = provideDateValidity();

/** Why the button waits: the picker is loading, or there is nowhere to create. */
const waitReason = computed(() => {
  if (isOwnerReady.value) return undefined;
  return translate(
    isOwnerBlocked.value ? 'admin.creation.owner.blocked' : 'admin.creation.owner.loading',
  );
});
const localErrors = ref<FieldErrors>({});
const mutation = useAdminMutation({
  mutate: (body: ContestBody) =>
    owner.value ? createOrganizationContest(owner.value.slug, body) : createContest(body),
  invalidates: () => [PUBLIC_CONTESTS_KEY, CONTEST_INDEX_KEY],
  successText: (created: EditableContest) =>
    translate('admin.contests.create.done', { key: created.key }),
  onDone: (created: EditableContest) => {
    void router.push({ name: 'admin-contestProblems', params: { key: created.key } });
  },
});
const errors = computed<FieldErrors>(() => ({
  ...localErrors.value,
  ...mutation.fieldErrors.value,
}));
/** The fields on screen; an error on any other one is listed above the button. */
const SHOWN_FIELDS: readonly string[] = ['key', 'name', 'startTime', 'endTime'];
const refusalText = computed(() => {
  const others = Object.entries(errors.value)
    .filter(([field]) => !SHOWN_FIELDS.includes(field))
    .map(([, text]) => text);
  if (others.length > 0) return others.join(' ');
  const isSaidByField = SHOWN_FIELDS.some((field) => errors.value[field]);
  return mutation.failure.value && !isSaidByField ? failureTextOf(mutation.failure.value) : '';
});

/** Nothing is sent while a local check fails; the body keeps out every group the account may not set. */
async function create() {
  localErrors.value = { ...checkContestForm(form.value), ...checkContestIdentity(form.value) };
  if (Object.keys(localErrors.value).length > 0 || hasUnreadableDate.value || !isOwnerReady.value)
    return;
  await mutation.run(toContestBody(form.value, can, Boolean(owner.value)));
}

// A message describes the values it was made from: editing a field retires it until the next submit.
watch(
  [form, owner],
  () => {
    localErrors.value = {};
    mutation.reset();
  },
  { deep: true },
);
</script>

<template>
  <form class="flex flex-col gap-5" novalidate @submit.prevent="create">
    <CreationOwnerPicker
      v-model="owner"
      v-model:ready="isOwnerReady"
      v-model:blocked="isOwnerBlocked"
      kind="contest"
      layout="field"
    />
    <FormField
      input-id="contest-key"
      :label="$t(`${KEY}.fields.key`)"
      :hint="$t(`${KEY}.hints.key`)"
      :error="errors.key"
      required
    >
      <TextInput v-model="form.key" class="font-mono" autocomplete="off" />
    </FormField>
    <FormField
      input-id="contest-name"
      :label="$t(`${KEY}.fields.name`)"
      :error="errors.name"
      required
    >
      <TextInput v-model="form.name" autocomplete="off" />
    </FormField>
    <DateTimeField
      v-model="start"
      input-id="contest-startTime"
      :label="$t(`${KEY}.fields.start`)"
      :error="errors.startTime"
      required
    />
    <div class="flex flex-col gap-2">
      <DateTimeField
        v-model="end"
        input-id="contest-endTime"
        :label="$t(`${KEY}.fields.end`)"
        :error="errors.endTime"
        :hint="lengthHint"
        required
      />
      <div
        class="flex flex-wrap items-center gap-2"
        role="group"
        :aria-label="$t(`${KEY}.basic.quickHint`)"
      >
        <span class="text-meta text-muted">{{ $t(`${KEY}.basic.quickLegend`) }}</span>
        <AppButton
          v-for="minutes in QUICK_MINUTES"
          :key="minutes"
          size="sm"
          :data-testid="`contest-quick-${minutes}`"
          :disabled="!form.startTime"
          @click="lastFor(minutes)"
        >
          {{ $t(`${KEY}.basic.quick`, { n: minutes }) }}
        </AppButton>
        <span v-if="!form.startTime" class="text-meta text-muted">{{
          $t(`${BENCH}.startFirst`)
        }}</span>
      </div>
    </div>
    <Notice v-if="refusalText" tone="danger" data-testid="create-refused">{{ refusalText }}</Notice>
    <p v-if="owner" class="text-meta text-muted" data-testid="contest-owner-access">
      {{ $t('admin.creation.contest.ownerAccess', { name: owner.name }) }}
    </p>
    <div class="flex flex-wrap items-center justify-end gap-2">
      <AppButton :to="{ name: 'admin-contests' }">{{ $t('common.cancel') }}</AppButton>
      <AppButton
        type="submit"
        tone="primary"
        :loading="mutation.isPending.value"
        :disabled="!isOwnerReady"
        :disabled-reason="waitReason"
      >
        {{ $t('admin.contests.create.submit') }}
      </AppButton>
    </div>
  </form>
</template>
