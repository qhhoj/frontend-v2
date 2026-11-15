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
 * After the end the board stays frozen until the organisers publish it. Contestants see that as the header's
 * "Chờ công bố" chip; editors, who read the live board, get this notice with "Công bố kết quả": the existing
 * unfreeze (`frozenLastMinutes: 0`), which rescores and opens the board to everyone.
 */
const props = defineProps<{ contest: ContestDetail }>();
const now = useNow();
const queryClient = useQueryClient();
/** Editors read the live board (`frozen: false`), so after the end the contest's own freeze decides for them. */
const isAwaitingPublish = computed(
  () =>
    props.contest.viewer.canEdit &&
    phaseAt(props.contest, now.value) === 'ended' &&
    isFrozenAt(props.contest, now.value),
);
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
    v-if="isAwaitingPublish"
    role="status"
    :title="$t('ranking.awaitingPublish.title')"
    data-testid="freeze-notice"
  >
    {{
      $t(
        'ranking.awaitingPublish.editorBody',
        { minutes: contest.frozenLastMinutes },
        contest.frozenLastMinutes,
      )
    }}
    <template #action>
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
