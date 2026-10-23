<script setup lang="ts">
import { translate } from '@/i18n';
import { computed, ref, useId, watch } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import {
  createRankingLink,
  fetchRankingLink,
  regenerateRankingLink,
  updateRankingLink,
} from '@/api/contest-editing.api';
import type { RankingLink } from '@/api/types/contest-editing';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import CopyButton from '@/components/CopyButton.vue';
import QueryState from '@/components/QueryState.vue';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import { failureTextOf } from '../../ui/admin-errors';
import AdminStatus from '../../ui/AdminStatus.vue';
import AdminDateTimeField from '../../ui/form/AdminDateTimeField.vue';
import { provideDateValidity } from '../../ui/form/date-validity';
import { CARD, INPUT, buttonClass } from '../../ui/controls';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { expiryPreview, publicRankingUrl, toLinkPatch } from './ranking-link';
import type { LinkForm } from './ranking-link';

const props = defineProps<{ contestKey: string }>();
const locale = useLocaleStore();
const linkKey = () => ['admin', 'ranking-link', props.contestKey] as const;
const {
  data: link,
  error,
  isPending,
  refetch,
} = useQuery({
  queryKey: computed(() => linkKey()),
  queryFn: () => fetchRankingLink(props.contestKey),
});
const statusName = useId();
const expiryName = useId();
const isRegenerateOpen = ref(false);
const formError = ref('');
const { hasUnreadableDate } = provideDateValidity();

const blankForm = (): LinkForm => ({
  status: 'public',
  expiryMode: 'U',
  expiryAmount: null,
  expiresAt: '',
});
const formOf = (stored: RankingLink | null | undefined): LinkForm =>
  stored
    ? {
        status: stored.status,
        expiryMode: stored.expiryMode,
        expiryAmount: stored.expiryAmount,
        expiresAt: stored.expiresAt ?? '',
      }
    : blankForm();
const form = ref<LinkForm>(formOf(link.value));
watch(link, (next) => (form.value = formOf(next)));
/** The date field speaks `string | null`; the form keeps '' for an unset expiry. */
const expiresAt = computed({
  get: () => form.value.expiresAt || null,
  set: (iso: string | null) => (form.value.expiresAt = iso ?? ''),
});

const url = computed(() =>
  link.value ? publicRankingUrl(link.value.token, globalThis.location.origin) : '',
);
const preview = computed(() =>
  link.value ? expiryPreview(form.value, new Date(link.value.regeneratedAt), locale.locale) : null,
);
const queryClient = useQueryClient();
/** Every write answers the link as it now is, so the answer is stored as is (a refetch could read it back stale). */
const storeLink = (saved: RankingLink) => queryClient.setQueryData(linkKey(), saved);

const create = useAdminMutation({
  mutate: () => createRankingLink(props.contestKey),
  onDone: storeLink,
});
const save = useAdminMutation({
  mutate: (patch: Parameters<typeof updateRankingLink>[1]) =>
    updateRankingLink(props.contestKey, patch),
  successText: () => translate('admin.contests.ranking.link.saved'),
  onDone: storeLink,
});
const regenerate = useAdminMutation({
  mutate: () => regenerateRankingLink(props.contestKey),
  onDone: (saved: RankingLink) => {
    storeLink(saved);
    isRegenerateOpen.value = false;
  },
});

/** A form the backend would refuse is said here and not sent. */
async function saveLink() {
  if (hasUnreadableDate.value) {
    formError.value = translate('admin.form.dateTime.invalid');
    return;
  }
  const patch = toLinkPatch(form.value);
  if ('error' in patch) {
    formError.value = patch.error;
    return;
  }
  formError.value = '';
  await save.run(patch);
}
</script>

<template>
  <section :class="[CARD, 'flex min-w-0 flex-col gap-5 p-5']">
    <header class="flex flex-col gap-1">
      <h2 class="m-0 text-base font-semibold">
        {{ $t('admin.contests.ranking.link.title') }}
      </h2>
    </header>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <div v-if="!link" class="flex flex-col gap-3">
        <p class="text-sm text-muted">{{ $t('admin.contests.ranking.link.none') }}</p>
        <button
          type="button"
          :class="buttonClass('primary')"
          class="self-start"
          @click="create.run(undefined)"
        >
          {{ $t('admin.contests.ranking.link.create') }}
        </button>
        <AdminStatus
          v-if="create.failure.value"
          kind="refused"
          :text="failureTextOf(create.failure.value)"
        />
      </div>

      <div v-else class="flex flex-col gap-5">
        <p class="text-sm">
          {{
            link.isValid
              ? $t('admin.contests.ranking.link.activeLine')
              : $t('admin.contests.ranking.link.inactiveLine')
          }}
        </p>
        <div class="flex flex-col gap-2">
          <code class="font-mono break-all text-sm">{{ url }}</code>
          <CopyButton :text="url" :label="$t('admin.contests.ranking.link.copy')" />
          <p class="text-sm text-muted">
            {{
              $t('admin.contests.ranking.link.regeneratedAt', {
                time: formatDate(link.regeneratedAt, 'datetime', locale.locale),
              })
            }}
          </p>
        </div>

        <fieldset class="flex flex-wrap gap-4">
          <legend class="font-semibold">
            {{ $t('admin.contests.ranking.link.statusLegend') }}
          </legend>
          <label class="flex min-h-9 items-center gap-2 touch:min-h-11"
            ><input v-model="form.status" type="radio" value="public" :name="statusName" />{{
              $t('admin.contests.ranking.link.statusPublic')
            }}</label
          >
          <label class="flex min-h-9 items-center gap-2 touch:min-h-11"
            ><input v-model="form.status" type="radio" value="private" :name="statusName" />{{
              $t('admin.contests.ranking.link.statusPrivate')
            }}</label
          >
        </fieldset>

        <fieldset class="flex flex-col gap-1">
          <legend class="font-semibold">
            {{ $t('admin.contests.ranking.link.expiryLegend') }}
          </legend>
          <label class="flex min-h-9 items-center gap-2 touch:min-h-11"
            ><input v-model="form.expiryMode" type="radio" value="U" :name="expiryName" />{{
              $t('admin.contests.ranking.link.expiryNone')
            }}</label
          >
          <label class="flex min-h-9 items-center gap-2 touch:min-h-11"
            ><input v-model="form.expiryMode" type="radio" value="M" :name="expiryName" />{{
              $t('admin.contests.ranking.link.expiryMinutes')
            }}</label
          >
          <label class="flex min-h-9 items-center gap-2 touch:min-h-11"
            ><input v-model="form.expiryMode" type="radio" value="D" :name="expiryName" />{{
              $t('admin.contests.ranking.link.expiryDays')
            }}</label
          >
          <label class="flex min-h-9 items-center gap-2 touch:min-h-11"
            ><input v-model="form.expiryMode" type="radio" value="A" :name="expiryName" />{{
              $t('admin.contests.ranking.link.expiryAt')
            }}</label
          >
          <div
            v-if="form.expiryMode === 'M' || form.expiryMode === 'D'"
            class="flex flex-col gap-1"
          >
            <label for="ranking-expiry-amount" class="text-sm font-semibold">{{
              $t('admin.contests.ranking.link.amountLabel')
            }}</label>
            <input
              id="ranking-expiry-amount"
              v-model.number="form.expiryAmount"
              type="number"
              min="1"
              :class="INPUT"
            />
            <p v-if="preview" class="text-sm text-muted">{{ preview }}</p>
          </div>
          <AdminDateTimeField
            v-if="form.expiryMode === 'A'"
            v-model="expiresAt"
            input-id="ranking-expiry-at"
            :label="$t('admin.contests.ranking.link.atLabel')"
          />
        </fieldset>

        <p v-if="formError" role="alert" class="text-sm text-negative">{{ formError }}</p>
        <div class="flex flex-wrap items-center gap-3">
          <button type="button" :class="buttonClass('primary')" @click="saveLink">
            {{ $t('admin.contests.ranking.link.save') }}
          </button>
          <button type="button" :class="buttonClass('danger')" @click="isRegenerateOpen = true">
            {{ $t('admin.contests.ranking.link.regenerate') }}
          </button>
          <AdminStatus
            v-if="save.failure.value"
            kind="refused"
            :text="failureTextOf(save.failure.value)"
          />
        </div>
      </div>
    </QueryState>

    <ConfirmDialog
      v-model:visible="isRegenerateOpen"
      :title="$t('admin.contests.ranking.link.regenerateTitle')"
      :body="$t('admin.contests.ranking.link.regenerateBody')"
      :confirm-label="$t('admin.contests.ranking.link.regenerateConfirm')"
      tone="danger"
      :busy="regenerate.isPending.value"
      @confirm="regenerate.run(undefined)"
    >
      <template #error>
        <p v-if="regenerate.failure.value" role="alert" class="text-sm text-negative">
          {{ failureTextOf(regenerate.failure.value) }}
        </p>
      </template>
    </ConfirmDialog>
  </section>
</template>
