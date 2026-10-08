<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { ContestDetail } from '@/api/types/contests';
import InlineBit from '@/components/InlineBit.vue';
import { translate } from '@/i18n';
import { errorMessageKey } from '@/i18n/error-message';
import { spanMessage } from '@/lib/contest-time';
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
import InContestStatus from './InContestStatus.vue';
import { useParticipation } from './use-participation';

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
const ACTIVE_BUTTON =
  'inline-flex min-h-11 items-center justify-center rounded-pill bg-gradient-accent px-5 font-semibold text-on-accent aria-disabled:cursor-progress aria-disabled:bg-none aria-disabled:bg-accent-soft aria-disabled:text-accent-soft-text';
const LOCKED_BUTTON =
  'inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-pill border border-line bg-surface-hover px-5 font-semibold text-content';

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

/** Runs the request behind the chosen action; the access code is passed through and never kept. */
async function perform(accessCode?: string) {
  const command = commandOf(chosen.value.kind);
  if (!command || isPending.value) return;
  await run(command, accessCode);
  isDialogOpen.value = false;
  participationStatus.value = translate(`contests.actions.done.${command}`);
  await nextTick();
  root.value?.focus();
}
function start() {
  if (isPending.value || commandOf(chosen.value.kind) === null) return;
  reset();
  if (chosen.value.needsAccessCode) isDialogOpen.value = true;
  else void perform().catch(() => undefined);
}
/** Closing the dialog (Cancel, Escape, a successful join) drops the last error, so it does not reappear in the bar. */
watch(isDialogOpen, (isOpen) => {
  if (!isOpen) reset();
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
      <RouterLink
        v-if="chosen.kind === 'signIn'"
        :to="signInTarget"
        class="inline-flex min-h-11 items-center justify-center rounded-pill bg-gradient-accent px-5 font-semibold text-on-accent"
      >
        {{ $t('contests.actions.signIn') }}
      </RouterLink>
      <InContestStatus
        v-else-if="chosen.kind === 'leave'"
        :contest="contest"
        :current="current"
        :is-pending="isPending"
        @leave="perform().catch(() => undefined)"
      />
      <template v-else>
        <span
          v-if="chosen.kind === 'registered'"
          class="w-fit rounded-pill bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-soft-text"
        >
          {{ $t('contests.actions.registeredBadge') }}
        </span>
        <p v-if="NOTICE_KEYS[chosen.kind]" class="text-muted">
          {{ $t(NOTICE_KEYS[chosen.kind]!) }}
        </p>
        <button
          v-if="hasButton"
          type="button"
          :aria-disabled="isLocked || isPending || undefined"
          :aria-busy="isPending || undefined"
          :class="isLocked ? LOCKED_BUTTON : ACTIVE_BUTTON"
          @click="start"
        >
          {{ actionLabel }}
        </button>
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
        v-if="error && !isDialogOpen"
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
    </div>
  </Teleport>
</template>
