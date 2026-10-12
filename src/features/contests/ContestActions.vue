<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import type { ContestDetail } from '@/api/types/contests';
import InlineBit from '@/components/InlineBit.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Chip from '@/components/ui/Chip.vue';
import { translate } from '@/i18n';
import { errorMessageKey } from '@/i18n/error-message';
import { spanMessage } from '@/lib/contest-time';
import { useDockHeight } from '@/features/problems/use-dock-height';
import { formatClock } from '@/lib/format';
import { PHONE_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { useNow } from '@/lib/use-now';
import { safeRedirect } from '@/router/safe-redirect';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import AccessCodeDialog from './AccessCodeDialog.vue';
import { actionFactsOf, commandOf, contestAction } from './contest-action';
import type { ContestActionKind } from './contest-action';
import { useCurrentParticipationQuery } from './contests.queries';
import ContestRulesDialog from './ContestRulesDialog.vue';
import InContestStatus from './InContestStatus.vue';
import { acceptanceOf, hasRules, needsRulesAcceptance } from './join-rules';
import type { ParticipationRefusal } from './participation-refusal';
import { useParticipation } from './use-participation';

/** The list or a stale detail may not know the contest needs a code: the backend's answer opens the dialog instead. */
const ACCESS_CODE_REQUIRED: ParticipationRefusal = 'access_code_required';
/** A stale detail may not know the contest has rules now: the backend's refusal opens the rules dialog instead. */
const RULES_NOT_ACCEPTED: ParticipationRefusal = 'rules_not_accepted';
/** The text each kind shows: a button label, or the notice itself when the kind has no request. Exhaustive, so a new kind fails to compile here. */
const TEXT_KEYS: Record<ContestActionKind, string> = {
  signIn: 'contests.actions.signIn',
  join: 'contests.actions.join',
  rejoin: 'contests.actions.rejoin',
  register: 'contests.actions.register',
  registered: 'contests.actions.opensAt',
  spectate: 'contests.actions.spectate',
  virtual: 'contests.actions.virtual',
  leave: 'contests.actions.leave',
  finished: 'contests.actions.continueSpectating',
  opensLater: 'contests.actions.opensAt',
  registrationClosed: 'contests.actions.registrationClosed',
  virtualDisallowed: 'contests.actions.virtualDisallowed',
};
/** A notice shown above the button: the time is over, and the button continues as a spectator. */
const NOTICE_KEYS: Partial<Record<ContestActionKind, string>> = {
  finished: 'contests.actions.finished',
};
/** Kinds whose button shows the opening time and cannot be pressed. */
const LOCKED_KINDS: readonly ContestActionKind[] = ['opensLater', 'registered'];

const props = defineProps<{ contest: ContestDetail }>();
const route = useRoute();
const session = useSessionStore();
const locale = useLocaleStore();
const now = useNow();
/** Below `md` the bar is teleported to the body: the header card's glass blur would otherwise pin it inside the card. */
const isPhone = useMediaQuery(PHONE_QUERY);
const chosen = computed(() =>
  contestAction(actionFactsOf(props.contest, session.user !== null, now.value)),
);
const { data: current } = useCurrentParticipationQuery(
  computed(() => chosen.value.kind === 'leave'),
);
const { run, isPending, error, reset } = useParticipation(computed(() => props.contest.key));
const root = ref<HTMLElement | null>(null);
/** The phone bar is fixed to the bottom: publish its height so the footer clears it. */
const phoneBar = computed(() => (isPhone.value ? root.value : null));
useDockHeight(phoneBar);
watch(isPhone, (isNow) => {
  if (!isNow) document.documentElement.style.removeProperty('--dock-height');
});
const isDialogOpen = ref(false);
const participationStatus = ref('');
const startClock = computed(() => formatClock(props.contest.startTime, locale.locale));
const virtualLength = computed(() =>
  spanMessage((Date.parse(props.contest.endTime) - Date.parse(props.contest.startTime)) / 1000),
);
const signInTarget = computed(() => ({
  path: '/login',
  query: { redirect: safeRedirect(route.fullPath) },
}));
const actionLabel = computed(() =>
  translate(TEXT_KEYS[chosen.value.kind], { time: startClock.value }),
);
const isLocked = computed(() => LOCKED_KINDS.includes(chosen.value.kind));
const hasButton = computed(() => isLocked.value || commandOf(chosen.value.kind) !== null);

const queryClient = useQueryClient();
const isRulesOpen = ref(false);
/** The detail is being read again after `rules_not_accepted`: its rules text may still be the old, empty one. */
const isRulesRefreshing = ref(false);
/** The viewer ticked the rules in this attempt; sent with the request and dropped when a new attempt starts. */
const hasAcceptedRules = ref(false);
const needsRules = computed(
  () =>
    hasRules(props.contest.rules) &&
    needsRulesAcceptance(chosen.value.kind, props.contest.viewer.liveStatus),
);
/** Only the live participation carries the acceptance a virtual run is compared with; virtual runs never feed it. */
const previousAcceptance = computed(() => acceptanceOf(props.contest.viewer.liveParticipation));

const isRefusedWith = (failure: unknown, code: ParticipationRefusal) =>
  failure instanceof ApiError && failure.code === code;

/** A refusal one of the dialogs answers (the code, or the rules the page did not know about); anything else stays in the bar. */
function openDialogFor(failure: unknown): boolean {
  if (isRefusedWith(failure, ACCESS_CODE_REQUIRED)) {
    reset();
    isRulesOpen.value = false;
    isDialogOpen.value = true;
    return true;
  }
  if (!isRefusedWith(failure, RULES_NOT_ACCEPTED)) return false;
  hasAcceptedRules.value = false;
  isDialogOpen.value = false;
  isRulesOpen.value = true;
  isRulesRefreshing.value = true;
  void queryClient
    .invalidateQueries({ queryKey: ['contests', 'detail'] })
    .finally(() => (isRulesRefreshing.value = false));
  return true;
}
function closeDialogs() {
  isDialogOpen.value = false;
  isRulesOpen.value = false;
  hasAcceptedRules.value = false;
}
/** Runs the request behind the chosen action; the access code is passed through and never kept. */
async function perform(accessCode?: string) {
  const command = commandOf(chosen.value.kind);
  if (!command || isPending.value) return;
  try {
    await run(command, { accessCode, acceptRules: hasAcceptedRules.value });
  } catch (failure: unknown) {
    if (!openDialogFor(failure)) throw failure;
    return;
  }
  closeDialogs();
  participationStatus.value = translate(`contests.actions.done.${command}`);
  await nextTick();
  root.value?.focus();
}
function askCodeOrPerform() {
  if (chosen.value.needsAccessCode) isDialogOpen.value = true;
  else void perform().catch(() => undefined);
}
function start() {
  if (isPending.value || commandOf(chosen.value.kind) === null) return;
  reset();
  hasAcceptedRules.value = false;
  if (needsRules.value) isRulesOpen.value = true;
  else askCodeOrPerform();
}
/** Ticked and confirmed: the code dialog follows when the action needs a code, else the request goes now. */
function acceptRules() {
  hasAcceptedRules.value = true;
  if (!chosen.value.needsAccessCode) {
    void perform().catch(() => undefined);
    return;
  }
  isRulesOpen.value = false;
  isDialogOpen.value = true;
}
/** Closing a dialog (Cancel, Escape, success) drops the last error, unless the other dialog takes over. */
watch(isDialogOpen, (isOpen) => {
  if (!isOpen && !isRulesOpen.value) reset();
});
watch(isRulesOpen, (isOpen) => {
  if (!isOpen && !isDialogOpen.value) reset();
});
</script>

<template>
  <Teleport to="body" :disabled="!isPhone">
    <div
      ref="root"
      data-testid="contest-actions"
      tabindex="-1"
      class="fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 border-t border-line bg-surface-solid p-3 md:static md:z-auto md:border-0 md:bg-transparent md:p-0"
    >
      <p data-testid="participation-status" role="status" aria-live="polite" class="sr-only">
        {{ participationStatus }}
      </p>
      <AppButton v-if="chosen.kind === 'signIn'" tone="primary" :to="signInTarget">
        {{ $t('contests.actions.signIn') }}
      </AppButton>
      <InContestStatus
        v-else-if="chosen.kind === 'leave'"
        :contest="contest"
        :current="current"
        :is-pending="isPending"
        @leave="perform().catch(() => undefined)"
      />
      <template v-else>
        <Chip v-if="chosen.kind === 'registered'" tone="accent" size="md" class="w-fit">
          {{ $t('contests.actions.registeredBadge') }}
        </Chip>
        <p v-if="NOTICE_KEYS[chosen.kind]" class="text-muted">
          {{ $t(NOTICE_KEYS[chosen.kind]!) }}
        </p>
        <AppButton
          v-if="hasButton"
          tone="primary"
          :disabled="isLocked"
          :loading="isPending"
          @click="start"
        >
          {{ actionLabel }}
        </AppButton>
        <p v-else class="text-muted">{{ actionLabel }}</p>
        <p v-if="chosen.kind === 'virtual'" class="text-sm text-muted">
          {{
            $t('contests.actions.virtualNote', {
              span: $t(virtualLength.key, virtualLength.params, virtualLength.count ?? 1),
            })
          }}
        </p>
        <p v-if="chosen.kind === 'spectate'" class="text-sm text-muted">
          {{ $t('contests.actions.spectateNote') }}
        </p>
      </template>
      <p
        v-if="error && !isDialogOpen && !isRulesOpen"
        role="alert"
        class="flex items-center gap-2.5 text-verdict-wa"
      >
        <InlineBit kind="sweat" />
        <span>{{ $t(errorMessageKey(error)) }}</span>
      </p>
      <AccessCodeDialog
        v-model:visible="isDialogOpen"
        :action-label="actionLabel"
        :contest-name="contest.name"
        :is-pending="isPending"
        :error="error"
        @submit="(code) => perform(code).catch(() => undefined)"
      />
      <ContestRulesDialog
        v-model:visible="isRulesOpen"
        :contest-name="contest.name"
        :revision="contest.rulesRevision"
        :rules-html="contest.rulesHtml"
        :is-refreshing="isRulesRefreshing"
        :action-label="actionLabel"
        :is-virtual="chosen.kind === 'virtual'"
        :is-pending="isPending"
        :error="error"
        :previous-acceptance="chosen.kind === 'virtual' ? previousAcceptance : null"
        @accept="acceptRules"
      />
    </div>
  </Teleport>
</template>
