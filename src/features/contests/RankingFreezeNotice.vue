<script setup lang="ts">
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { Sparkles } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { updateContest } from '@/api/contest-editing.api';
import type { ContestDetail } from '@/api/types/contests';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Notice from '@/components/ui/Notice.vue';
import { errorMessageKey } from '@/i18n/error-message';
import { isFrozenAt, phaseAt } from '@/lib/contest-time';
import { useNow } from '@/lib/use-now';

/**
 * The ranking freeze, said for the moment it is read. While the contest runs: the last minutes show "?".
 * After the end the board stays frozen until the organisers publish it, so the notice says who is waited for, and editors
 * (who see the live board) get "Công bố kết quả": the existing unfreeze (`frozenLastMinutes: 0`), which rescores and opens
 * the board to everyone.
 */
const props = defineProps<{ contest: ContestDetail; isBoardFrozen: boolean }>();
const now = useNow();
const queryClient = useQueryClient();
const isEnded = computed(() => phaseAt(props.contest, now.value) === 'ended');
/** Editors read the live board (`frozen: false`), so after the end the contest's own freeze decides for them. */
const isAwaitingPublish = computed(
  () => isEnded.value && isFrozenAt(props.contest, now.value) && props.contest.viewer.canEdit,
);
const isShown = computed(() => props.isBoardFrozen || isAwaitingPublish.value);
const isConfirming = ref(false);
const publish = useMutation({
  mutationFn: () => updateContest(props.contest.key, { frozenLastMinutes: 0 }),
  onSuccess: async () => {
    isConfirming.value = false;
    await queryClient.invalidateQueries({ queryKey: ['contests'] });
  },
});
const ask = () => {
  publish.reset();
  isConfirming.value = true;
};
</script>

<template>
  <Notice
    v-if="isShown && !isEnded"
    role="status"
    :title="$t('ranking.frozenTitle')"
    data-testid="freeze-notice"
  >
    {{
      $t('ranking.frozenBody', { minutes: contest.frozenLastMinutes }, contest.frozenLastMinutes)
    }}
  </Notice>
  <Notice
    v-else-if="isShown"
    role="status"
    :title="$t('ranking.awaitingPublish.title')"
    data-testid="freeze-notice"
  >
    {{
      contest.viewer.canEdit
        ? $t(
            'ranking.awaitingPublish.editorBody',
            { minutes: contest.frozenLastMinutes },
            contest.frozenLastMinutes,
          )
        : $t(
            'ranking.awaitingPublish.body',
            { minutes: contest.frozenLastMinutes },
            contest.frozenLastMinutes,
          )
    }}
    <template v-if="contest.viewer.canEdit" #action>
      <AppButton tone="primary" data-testid="publish-results" @click="ask">
        <template #icon><Sparkles class="size-4" aria-hidden="true" /></template>
        {{ $t('ranking.awaitingPublish.button') }}
      </AppButton>
    </template>
  </Notice>
  <ConfirmDialog
    v-model:visible="isConfirming"
    :title="$t('ranking.awaitingPublish.confirmTitle')"
    :body="$t('ranking.awaitingPublish.confirmBody')"
    :confirm-label="$t('ranking.awaitingPublish.button')"
    :busy="publish.isPending.value"
    @confirm="publish.mutate()"
  >
    <template #error>
      <p v-if="publish.error.value" role="alert" class="text-sm text-negative">
        {{ $t(errorMessageKey(publish.error.value)) }}
      </p>
    </template>
  </ConfirmDialog>
</template>
