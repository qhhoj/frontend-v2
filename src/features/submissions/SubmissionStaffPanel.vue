<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { ApiError } from '@/api/client';
import { abortSubmission, rejectSubmission, rejudgeSubmission } from '@/api/submission-actions.api';
import type { SubmissionDetail } from '@/api/types/submissions';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import AdminBit from '@/features/admin/shell/AdminBit.vue';
import AdminStatus from '@/features/admin/ui/AdminStatus.vue';
import SubmissionLockControl from './SubmissionLockControl.vue';
import { BUTTON } from '@/features/admin/ui/controls';
import { failureTextOf, hasIssueCode } from '@/features/admin/ui/admin-errors';
import { useAdminMutation } from '@/features/admin/ui/use-admin-mutation';
import { hasPermission } from '@/lib/permissions';
import { formatDateTime } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { translate } from '@/i18n';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { useViewerId } from '@/stores/use-viewer-id';
import {
  hasAnyStaffAction,
  holdsAnyStaffPermission,
  isUnfinished,
  lockLineOf,
  staffActionsFor,
} from './staff-actions';

type StaffAction = 'rejudge' | 'reject' | 'abort';
interface Outcome {
  kind: 'done' | 'refused';
  text: string;
}

/** The board redraws the lock line and the waiting looks as the clock moves; once a half minute is enough. */
const CLOCK_REFRESH_MS = 30_000;
const CALLS = {
  rejudge: rejudgeSubmission,
  reject: rejectSubmission,
  abort: abortSubmission,
} as const;

const props = defineProps<{ submission: SubmissionDetail }>();
const session = useSessionStore();
const locale = useLocaleStore();
const now = useNow(CLOCK_REFRESH_MS);
const can = (permission: string) => hasPermission(session.user, permission);

const actions = computed(() => staffActionsFor(props.submission, can, now.value));
const isVisible = computed(
  () =>
    holdsAnyStaffPermission(can) &&
    (hasAnyStaffAction(actions.value) || props.submission.viewer.canLock),
);
/** The board's order: a judging submission offers abort first, a finished one rejudge first. */
const order = computed<StaffAction[]>(() =>
  isUnfinished(props.submission) ? ['abort', 'rejudge', 'reject'] : ['rejudge', 'reject', 'abort'],
);
const lockLine = computed(() => lockLineOf(props.submission, now.value));
const stateLineKey = computed(() =>
  isUnfinished(props.submission) ? 'admin.staff.state.running' : 'admin.staff.state.finished',
);

const pending = ref<StaffAction | null>(null);
const isDialogOpen = ref(false);
const outcome = ref<Outcome | null>(null);
const viewerId = useViewerId();
const queryClient = useQueryClient();

/** What the row says about its state: an action sent against this state is not sent again while the row still says it. */
const stateKey = computed(() =>
  [
    props.submission.status,
    props.submission.result,
    props.submission.judgedDate,
    props.submission.rejudgedDate,
  ].join('|'),
);
const sent = ref<{ action: StaffAction; key: string } | null>(null);
const isSentFor = (action: StaffAction) =>
  sent.value?.action === action && sent.value.key === stateKey.value;

const mutation = useAdminMutation<StaffAction, StaffAction>({
  mutate: async (action) => {
    await CALLS[action](props.submission.id);
    return action;
  },
  /** The page's row is refetched after a write: the panel shows the new state and the live stream follows a queued row. */
  onDone: (action) => {
    sent.value = { action, key: stateKey.value };
    void queryClient.invalidateQueries({
      queryKey: ['submissions', 'detail', viewerId.value, props.submission.id],
    });
  },
});

/** A button the account may press now: ready and not already sent for this state. Other buttons stay on screen, `aria-disabled`, and say why. */
const isReady = (action: StaffAction) => actions.value[action] === 'ready' && !isSentFor(action);
function reasonOf(action: StaffAction): string | null {
  if (isSentFor(action)) return translate('admin.staff.reason.sent');
  const state = actions.value[action];
  if (state === 'locked') return translate('admin.staff.reason.locked');
  if (state !== 'waiting') return null;
  return translate(
    action === 'abort' ? 'admin.staff.reason.finished' : 'admin.staff.reason.waiting',
  );
}
const blockedReasons = computed(() =>
  order.value.flatMap((action) => {
    const reason = reasonOf(action);
    return reason ? [{ action, reason }] : [];
  }),
);
const reasonIdOf = (action: StaffAction) => `staff-reason-${action}`;

function openAction(action: StaffAction) {
  if (!isReady(action)) return;
  pending.value = action;
  isDialogOpen.value = true;
}

/** The dialog's copy; the rejudge body names the result and points it throws away. */
const dialogCopy = computed(() => {
  const action = pending.value ?? 'rejudge';
  const { result, points } = props.submission;
  const pointsText =
    points === null
      ? translate('admin.staff.noPoints')
      : translate('admin.staff.points', { points });
  return {
    title: translate(`admin.staff.dialog.${action}.title`),
    body: translate(`admin.staff.dialog.${action}.body`, {
      result: result ?? '—',
      points: pointsText,
    }),
    label: translate(`admin.staff.dialog.${action}.label`),
  };
});

/** A 409 is a judge holding the submission; the flags should have stopped the click, so the text says what to do. */
function refusalTextOf(error: unknown): string {
  const isConflict =
    error instanceof ApiError && error.code === 'conflict' && !hasIssueCode(error, 'busy');
  return isConflict ? translate('admin.staff.conflict') : failureTextOf(error);
}

async function confirmAction() {
  if (!pending.value) return;
  const done = await mutation.run(pending.value);
  if (done) outcome.value = { kind: 'done', text: translate(`admin.staff.done.${done}`) };
  else if (mutation.failure.value)
    outcome.value = { kind: 'refused', text: refusalTextOf(mutation.failure.value) };
  isDialogOpen.value = false;
}
</script>

<template>
  <section
    v-if="isVisible"
    data-testid="staff-panel"
    class="glass flex flex-col gap-4 rounded-panel p-5"
    aria-labelledby="staff-panel-title"
  >
    <header class="flex flex-wrap items-center gap-3">
      <span class="rounded-pill border border-line px-2.5 py-0.5 text-xs font-semibold">
        {{ $t('admin.staff.chip') }}
      </span>
      <AdminBit placement="header" />
      <h2 id="staff-panel-title" class="font-display text-base font-bold">
        {{ $t('admin.staff.title') }}
      </h2>
    </header>
    <p class="text-sm text-muted">{{ $t(stateLineKey) }}</p>
    <p v-if="lockLine" class="text-sm text-muted">
      {{
        $t(`admin.staff.lock.${lockLine.key}`, {
          time: formatDateTime(lockLine.time, locale.locale),
        })
      }}
    </p>

    <p v-if="submission.judgedOn" class="text-sm text-muted">
      {{ $t('admin.staff.judgedOn', { judge: submission.judgedOn }) }}
    </p>

    <div class="flex flex-wrap gap-3">
      <template v-for="action in order" :key="action">
        <button
          v-if="actions[action] !== 'hidden'"
          type="button"
          :class="BUTTON.danger"
          :aria-disabled="!isReady(action) || undefined"
          :aria-describedby="!isReady(action) ? reasonIdOf(action) : undefined"
          @click="openAction(action)"
        >
          {{ $t(`admin.staff.buttons.${action}`) }}
        </button>
      </template>
    </div>
    <ul class="flex flex-col gap-1 text-sm text-muted">
      <li v-for="blocked in blockedReasons" :id="reasonIdOf(blocked.action)" :key="blocked.action">
        {{ blocked.reason }}
      </li>
    </ul>

    <SubmissionLockControl v-if="submission.viewer.canLock" :submission="submission" />

    <AdminStatus v-if="outcome" :kind="outcome.kind" :text="outcome.text" />

    <ConfirmDialog
      v-if="pending"
      v-model:visible="isDialogOpen"
      tone="danger"
      :title="dialogCopy.title"
      :body="dialogCopy.body"
      :confirm-label="dialogCopy.label"
      :busy="mutation.isPending.value"
      @confirm="confirmAction"
    />
  </section>
</template>
