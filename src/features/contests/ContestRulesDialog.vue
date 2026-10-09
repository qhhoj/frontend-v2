<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import InlineBit from '@/components/InlineBit.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import UserContent from '@/components/UserContent.vue';
import { ApiError } from '@/api/client';
import { errorMessageKey } from '@/i18n/error-message';
import { formatDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { EXTRAS_BITS } from './contest-extras-bits';

/**
 * M3A: the contest rules (rendered by the backend, shown through UserContent), one box to tick and the action button,
 * `aria-disabled` until the box is ticked. The tick lives only while the dialog is open.
 */
const props = defineProps<{
  contestName: string;
  revision: number;
  rulesHtml: string;
  actionLabel: string;
  isVirtual: boolean;
  isPending: boolean;
  error: unknown;
  /** The acceptance on the viewer's live participation (never a virtual run's); shown on a virtual run only. */
  previousAcceptance?: { revision: number; at: string } | null;
}>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ accept: [] }>();
const locale = useLocaleStore();
const isTicked = ref(false);
const boxId = useId();
const SKELETON_LINES = 4;
const isLoading = computed(() => props.rulesHtml === '');
const canAccept = computed(() => isTicked.value && !isLoading.value);
const isNotRecorded = computed(
  () => props.error instanceof ApiError && props.error.code === 'rules_not_accepted',
);

watch(visible, (isOpen) => {
  if (!isOpen) isTicked.value = false;
});
function accept() {
  if (canAccept.value && !props.isPending) emit('accept');
}
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="isVirtual ? $t('joinRules.dialogTitleVirtual') : $t('joinRules.dialogTitle')"
    :confirm-label="actionLabel"
    :busy="isPending"
    :can-confirm="canAccept"
    @confirm="accept"
  >
    <p class="flex items-center gap-2.5 text-sm text-muted">
      <InlineBit :kind="EXTRAS_BITS.rulesHeading" />
      <span>{{ $t('joinRules.dialogLead', { name: contestName, revision }) }}</span>
    </p>
    <p v-if="isVirtual" class="rounded-row bg-accent-soft px-3 py-2 text-sm text-accent-soft-text">
      <strong>{{ $t('joinRules.virtualAgain') }}</strong>
      <template v-if="previousAcceptance">
        {{
          $t('joinRules.previous', {
            revision: previousAcceptance.revision,
            time: formatDateTime(previousAcceptance.at, locale.locale),
          })
        }}
      </template>
    </p>
    <div
      v-if="isLoading"
      aria-hidden="true"
      class="flex flex-col gap-2 rounded-row border border-line p-3"
    >
      <SkeletonBlock
        v-for="index in SKELETON_LINES"
        :key="index"
        data-skeleton-region="rules-line"
        class="h-4 w-full"
      />
    </div>
    <!-- A focusable scroll box: long rules scroll inside it, and keyboard users can scroll it too. -->
    <div
      v-else
      tabindex="0"
      :aria-label="$t('joinRules.textLabel')"
      class="max-h-[45vh] overflow-y-auto rounded-row border border-line p-3"
    >
      <UserContent :html="rulesHtml" />
    </div>
    <label :for="boxId" class="flex min-h-11 cursor-pointer items-center gap-3 font-semibold">
      <input :id="boxId" v-model="isTicked" type="checkbox" class="size-5 shrink-0 accent-accent" />
      {{ $t('joinRules.agree') }}
    </label>
    <p v-if="!isTicked" class="text-sm text-muted">{{ $t('joinRules.tickHint') }}</p>
    <template #error>
      <p v-if="error" role="alert" class="flex items-center gap-2.5 text-verdict-wa">
        <InlineBit :kind="EXTRAS_BITS.rulesRefused" />
        <span>
          <strong>{{
            $t(isNotRecorded ? 'joinRules.notRecordedTitle' : 'joinRules.refusedTitle')
          }}</strong>
          {{ $t(errorMessageKey(error)) }}
        </span>
      </p>
    </template>
  </ConfirmDialog>
</template>
