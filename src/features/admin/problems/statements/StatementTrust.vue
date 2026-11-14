<script setup lang="ts">
import { computed, ref } from 'vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Notice from '@/components/ui/Notice.vue';

/**
 * The trust of the slot on screen: what the public page does with its HTML and, for a holder of
 * `judge.problem_full_markup`, the one way to change it. Trusting first shows the saved source as plain text; both
 * directions confirm, since each changes what readers get.
 */
const props = defineProps<{
  isTrusted: boolean;
  isFullMarkup: boolean;
  /** The viewer holds `judge.problem_full_markup` (the action shows). */
  canManage: boolean;
  /** Why the action is off (unsaved changes); undefined when it may run. */
  blockedReason?: string;
  /** The saved text the trust would cover. */
  source: string;
  busy: boolean;
}>();
const emit = defineEmits<{ setTrust: [isTrusted: boolean] }>();
const isReviewing = ref(false);
const isRevoking = ref(false);
const KEY = 'admin.problems.statements.trust';
const summaryKey = computed(() => {
  if (!props.isTrusted) return `${KEY}.untrustedSummary`;
  return props.isFullMarkup ? `${KEY}.trustedSummary` : `${KEY}.trustedIdleSummary`;
});

function confirm(isTrusted: boolean) {
  emit('setTrust', isTrusted);
  isReviewing.value = false;
  isRevoking.value = false;
}
</script>

<template>
  <Notice
    compact
    :role="null"
    :tone="isTrusted ? 'success' : 'info'"
    :title="$t(isTrusted ? `${KEY}.trustedTitle` : `${KEY}.untrustedTitle`)"
    data-testid="statement-trust"
  >
    {{ $t(summaryKey) }}
    <template v-if="canManage" #action>
      <AppButton
        :loading="busy"
        :disabled="blockedReason !== undefined"
        :disabled-reason="blockedReason"
        @click="isTrusted ? (isRevoking = true) : (isReviewing = true)"
      >
        {{ $t(isTrusted ? `${KEY}.revoke` : `${KEY}.review`) }}
      </AppButton>
    </template>
  </Notice>
  <ConfirmDialog
    v-model:visible="isReviewing"
    tone="danger"
    size="lg"
    :title="$t(`${KEY}.dialogTitle`)"
    :body="$t(`${KEY}.dialogBody`)"
    :confirm-label="$t(`${KEY}.confirm`)"
    :busy="busy"
    @confirm="confirm(true)"
  >
    <pre
      class="max-h-80 overflow-auto rounded-row bg-surface-hover px-3.5 py-3 text-sm whitespace-pre-wrap"
      data-testid="statement-trust-source"
      >{{ source }}</pre>
  </ConfirmDialog>
  <ConfirmDialog
    v-model:visible="isRevoking"
    :title="$t(`${KEY}.revokeTitle`)"
    :body="$t(`${KEY}.revokeBody`)"
    :confirm-label="$t(`${KEY}.revoke`)"
    :busy="busy"
    @confirm="confirm(false)"
  />
</template>
