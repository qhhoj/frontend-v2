<script setup lang="ts">
import { Check, X } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import type { ShareExpiry, ShareSummary } from '@/api/types/shares';
import AppButton from '@/components/ui/AppButton.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import Modal from '@/components/ui/Modal.vue';
import Notice from '@/components/ui/Notice.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import ShareExpiryPicker from './ShareExpiryPicker.vue';
import ShareLinkBox from './ShareLinkBox.vue';
import { SUBMISSION_DEFAULT_EXPIRY, expiryMessage } from './share-expiry';
import { shareFailureOf } from './share-failure';
import type { ShareFailure } from './share-failure';
import {
  useCreateSubmissionShare,
  useDeleteShare,
  useSubmissionSharesQuery,
} from './shares.queries';

/**
 * "Chia sẻ" on a submission, one dialog with five states: the list of what becomes public with the expiry (form), the new link
 * (created), the link made before with "take a new snapshot" (existing), and the two refusals: a running contest and a setter's
 * source rule (blocked). The backend refuses a contest problem when the person tries, so "blocked" is an answer, not a precheck.
 */
const props = defineProps<{ submissionId: string }>();
const visible = defineModel<boolean>('visible', { required: true });
const locale = useLocaleStore();

const earlier = useSubmissionSharesQuery(
  () => props.submissionId,
  () => visible.value,
);
const expiry = ref<ShareExpiry | null>(SUBMISSION_DEFAULT_EXPIRY);
const created = ref<ShareSummary | null>(null);
const failure = ref<ShareFailure | null>(null);
/** "Chụp bản mới" leaves the earlier link's panel for the form. */
const isTakingNew = ref(false);
const isDeleteOpen = ref(false);
const create = useCreateSubmissionShare();
const remove = useDeleteShare();

watch(visible, (isOpen) => {
  if (!isOpen) return;
  expiry.value = SUBMISSION_DEFAULT_EXPIRY;
  created.value = null;
  failure.value = null;
  isTakingNew.value = false;
});

const earlierShare = computed(() => earlier.data.value?.items[0] ?? null);
const state = computed(() => {
  if (created.value) return 'created';
  if (failure.value && failure.value.kind !== 'other') return 'blocked';
  if (earlierShare.value && !isTakingNew.value) return 'existing';
  return 'form';
});
const shownShare = computed(() => created.value ?? earlierShare.value);
const failureKey = computed(() => (failure.value?.kind === 'other' ? failure.value.key : null));
const takenAt = computed(() => formatDate(new Date().toISOString(), 'datetime', locale.locale));
const expiryLine = computed(() => expiryMessage(shownShare.value?.expiresAt ?? null, Date.now()));

async function submit() {
  failure.value = null;
  try {
    created.value = await create.mutateAsync({
      submissionId: props.submissionId,
      expiry: expiry.value ?? SUBMISSION_DEFAULT_EXPIRY,
    });
  } catch (error) {
    failure.value = shareFailureOf(error);
  }
}
async function removeLink() {
  if (!shownShare.value) return;
  try {
    await remove.mutateAsync(shownShare.value.code);
    isDeleteOpen.value = false;
    created.value = null;
    isTakingNew.value = false;
    visible.value = false;
  } catch (error) {
    failure.value = shareFailureOf(error);
    isDeleteOpen.value = false;
  }
}
</script>

<template>
  <Modal
    v-model:visible="visible"
    size="sm"
    :title="state === 'blocked' ? $t('share.dialog.blockedTitle') : $t('share.dialog.title')"
  >
    <QueryState v-if="earlier.isPending.value" :loading="true" :error="null">
      <template #skeleton><SkeletonBlock class="h-40 w-full" /></template>
    </QueryState>
    <div v-else-if="state === 'form'" class="flex flex-col gap-5" data-testid="share-form">
      <p class="m-0 text-sm text-muted">
        {{ $t('share.dialog.snapshot', { time: takenAt }) }}
      </p>
      <ul class="m-0 flex list-none flex-col gap-2 p-0 text-sm">
        <li class="flex items-start gap-2">
          <Check aria-hidden="true" class="mt-0.5 size-4 shrink-0 text-positive" />
          <span
            ><strong>{{ $t('share.dialog.includes') }}</strong>
            {{ $t('share.dialog.includesList') }}</span
          >
        </li>
        <li class="flex items-start gap-2">
          <X aria-hidden="true" class="mt-0.5 size-4 shrink-0 text-negative" />
          <span
            ><strong>{{ $t('share.dialog.excludes') }}</strong>
            {{ $t('share.dialog.excludesList') }}</span
          >
        </li>
      </ul>
      <ShareExpiryPicker v-model="expiry" :hint="$t('share.dialog.publicHint')" />
      <Notice v-if="failureKey" tone="danger" inline>{{ $t(failureKey) }}</Notice>
    </div>
    <div v-else-if="state === 'blocked'" data-testid="share-blocked">
      <Notice
        tone="warning"
        :title="
          $t(failure?.kind === 'hidden' ? 'share.dialog.hiddenTitle' : 'share.dialog.contestTitle')
        "
      >
        {{
          $t(failure?.kind === 'hidden' ? 'share.dialog.hiddenBody' : 'share.dialog.contestBody')
        }}
      </Notice>
    </div>
    <div v-else-if="shownShare" class="flex flex-col gap-4" :data-testid="`share-${state}`">
      <Notice v-if="state === 'created'" tone="success">
        <strong>{{ $t('share.dialog.created') }}</strong> {{ expiryLine }}
      </Notice>
      <p v-else class="m-0 text-sm">
        {{
          $t('share.dialog.existing', {
            time: formatDate(shownShare.createdAt, 'datetime', locale.locale),
          })
        }}
      </p>
      <ShareLinkBox :code="shownShare.code" />
      <Notice v-if="failureKey" tone="danger" inline>{{ $t(failureKey) }}</Notice>
    </div>
    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <template v-if="state === 'form'">
          <AppButton @click="visible = false">{{ $t('common.cancel') }}</AppButton>
          <AppButton
            tone="primary"
            data-testid="share-create"
            :loading="create.isPending.value"
            @click="submit"
          >
            {{ $t('share.dialog.create') }}
          </AppButton>
        </template>
        <template v-else-if="state === 'blocked'">
          <AppButton tone="primary" @click="visible = false">{{ $t('common.close') }}</AppButton>
        </template>
        <template v-else>
          <AppButton tone="danger" data-testid="share-delete" @click="isDeleteOpen = true">
            {{ $t('share.delete.confirm') }}
          </AppButton>
          <AppButton v-if="state === 'existing'" @click="isTakingNew = true">
            {{ $t('share.dialog.takeNew') }}
          </AppButton>
          <AppButton tone="primary" @click="visible = false">{{
            $t('share.dialog.done')
          }}</AppButton>
        </template>
      </div>
    </template>
  </Modal>
  <ConfirmDialog
    v-model:visible="isDeleteOpen"
    tone="danger"
    :title="$t('share.delete.title')"
    :body="$t('share.delete.body')"
    :confirm-label="$t('share.delete.confirm')"
    :busy="remove.isPending.value"
    @confirm="removeLink"
  />
</template>
