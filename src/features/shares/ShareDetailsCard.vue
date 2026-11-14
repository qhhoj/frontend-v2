<script setup lang="ts">
import { Flag, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import type { ShareView } from '@/api/types/shares';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import UserLink from '@/components/UserLink.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Card from '@/components/ui/Card.vue';
import Notice from '@/components/ui/Notice.vue';
import { useToast } from '@/components/ui/use-toast';
import { translate } from '@/i18n';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import { useRouter } from 'vue-router';
import ReportShareDialog from './ReportShareDialog.vue';
import ShareLinkBox from './ShareLinkBox.vue';
import TakedownDialog from './TakedownDialog.vue';
import { expiryMessage } from './share-expiry';
import { sizeText } from './paste-size';
import { shareFailureOf } from './share-failure';
import { useDeleteShare, useRestoreShare } from './shares.queries';

/**
 * The rail's details: who and when, the problem (only when the API names it, that is, the viewer may open it), the
 * expiry and the actions by who is looking: report for a signed-in reader, copy and delete for the owner, takedown or
 * restore for staff. Little-used actions come last.
 */
const props = defineProps<{ share: ShareView }>();
const locale = useLocaleStore();
const router = useRouter();
const toast = useToast();
const isReportOpen = ref(false);
const isTakedownOpen = ref(false);
const isDeleteOpen = ref(false);
const failureKey = ref<string | null>(null);
const remove = useDeleteShare();
const restore = useRestoreShare();
const isPaste = computed(() => props.share.kind === 'paste');
const bytes = computed(() => new TextEncoder().encode(props.share.source).length);
const isTakenDown = computed(() => props.share.takenDown !== null);

async function run(action: () => Promise<unknown>) {
  failureKey.value = null;
  try {
    await action();
    return true;
  } catch (error) {
    const failure = shareFailureOf(error);
    failureKey.value = failure.kind === 'other' ? failure.key : 'errors.generic';
    return false;
  }
}
async function removeShare() {
  const isDone = await run(() => remove.mutateAsync(props.share.code));
  isDeleteOpen.value = false;
  if (!isDone) return;
  toast.show({ text: translate('share.delete.done') });
  await router.push({ name: 'settings-shares' });
}
const restoreShare = () => run(() => restore.mutateAsync(props.share.code));
</script>

<template>
  <Card as="div" class="flex min-w-0 flex-col gap-4 rounded-card p-6" data-testid="share-details">
    <h2 class="section-title">{{ $t('share.details.title') }}</h2>
    <dl class="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
      <template v-if="share.author">
        <dt class="text-muted">{{ $t('share.details.author') }}</dt>
        <dd class="m-0 min-w-0">
          <UserLink :username="share.author.username" :rating="share.author.rating" />
        </dd>
      </template>
      <template v-if="share.problem">
        <dt class="text-muted">{{ $t('share.details.problem') }}</dt>
        <dd class="m-0 min-w-0">
          <RouterLink
            :to="{ name: 'problem', params: { code: share.problem.code } }"
            class="text-accent-text hover:underline"
            >{{ share.problem.name }}</RouterLink
          >
        </dd>
      </template>
      <dt class="text-muted">{{ $t('share.details.createdAt') }}</dt>
      <dd class="m-0">{{ formatDate(share.createdAt, 'datetime', locale.locale) }}</dd>
      <template v-if="isPaste">
        <dt class="text-muted">{{ $t('share.details.language') }}</dt>
        <dd class="m-0">{{ share.language.name }}</dd>
        <dt class="text-muted">{{ $t('share.details.size') }}</dt>
        <dd class="m-0">{{ sizeText(bytes) }}</dd>
      </template>
      <dt class="text-muted">{{ $t('share.details.expiry') }}</dt>
      <dd class="m-0" data-testid="share-expiry">
        {{ expiryMessage(share.expiresAt, Date.now()) }}
      </dd>
    </dl>
    <Notice v-if="share.hiddenReason" tone="warning" data-testid="share-hidden-notice">
      {{ $t(`share.hidden.${share.hiddenReason}`, { reason: share.takenDown?.reason ?? '' }) }}
    </Notice>
    <Notice
      v-else-if="isTakenDown && share.takenDown"
      tone="warning"
      data-testid="share-taken-down"
    >
      {{ $t('share.hidden.taken_down', { reason: share.takenDown.reason }) }}
    </Notice>
    <ShareLinkBox v-if="share.viewer.isOwner" :code="share.code" />
    <Notice v-if="failureKey" tone="danger" inline>{{ $t(failureKey) }}</Notice>
    <p class="m-0 text-meta text-muted">{{ $t('share.details.public') }}</p>
    <div class="flex flex-wrap gap-2">
      <AppButton
        v-if="share.viewer.canReport"
        data-testid="share-report"
        @click="isReportOpen = true"
      >
        <template #icon><Flag aria-hidden="true" class="size-4" /></template>
        {{ $t('share.report.open') }}
      </AppButton>
      <AppButton
        v-if="share.viewer.canTakeDown && !isTakenDown"
        data-testid="share-takedown"
        @click="isTakedownOpen = true"
      >
        <template #icon><ShieldAlert aria-hidden="true" class="size-4" /></template>
        {{ $t('share.takedown.open') }}
      </AppButton>
      <AppButton
        v-if="share.viewer.canTakeDown && isTakenDown"
        data-testid="share-restore"
        :loading="restore.isPending.value"
        @click="restoreShare"
      >
        <template #icon><ShieldCheck aria-hidden="true" class="size-4" /></template>
        {{ $t('share.takedown.restore') }}
      </AppButton>
      <AppButton
        v-if="share.viewer.canDelete"
        tone="danger"
        data-testid="share-delete"
        @click="isDeleteOpen = true"
      >
        <template #icon><Trash2 aria-hidden="true" class="size-4" /></template>
        {{ $t('share.delete.confirm') }}
      </AppButton>
    </div>
    <ReportShareDialog
      v-model:visible="isReportOpen"
      :code="share.code"
      @sent="toast.show({ text: $t('share.report.sent') })"
    />
    <TakedownDialog v-model:visible="isTakedownOpen" :code="share.code" />
    <ConfirmDialog
      v-model:visible="isDeleteOpen"
      tone="danger"
      :title="$t('share.delete.title')"
      :body="$t('share.delete.body')"
      :confirm-label="$t('share.delete.confirm')"
      :busy="remove.isPending.value"
      @confirm="removeShare"
    />
  </Card>
</template>
