<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { ContestDetail } from '@/api/types/contests';
import InlineBit from '@/components/InlineBit.vue';
import { translate } from '@/i18n';
import { errorMessageKey } from '@/i18n/error-message';
import { spanMessage } from '@/lib/contest-time';
import { formatClock } from '@/lib/format';
import { useMediaQuery, PHONE_QUERY } from '@/lib/use-media-query';
import { useNow } from '@/lib/use-now';
import { safeRedirect } from '@/router/safe-redirect';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import AccessCodeDialog from './AccessCodeDialog.vue';
import { actionFactsOf, commandOf, contestAction } from './contest-action';
import { useCurrentParticipationQuery } from './contests.queries';
import InContestStatus from './InContestStatus.vue';
import { useParticipation } from './use-participation';

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
const isButton = computed(
  () => commandOf(chosen.value.kind) !== null && chosen.value.kind !== 'leave',
);
const actionLabel = computed(() =>
  isButton.value
    ? translate(`contests.actions.${chosen.value.kind}`, { time: startClock.value })
    : '',
);

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
  reset();
  if (chosen.value.needsAccessCode) isDialogOpen.value = true;
  else void perform().catch(() => undefined);
}
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
      <template v-else-if="isButton">
        <button
          type="button"
          :aria-disabled="isPending || undefined"
          class="inline-flex min-h-11 items-center justify-center rounded-pill bg-gradient-accent px-5 font-semibold text-on-accent"
          @click="start"
        >
          {{ actionLabel }}
        </button>
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
      <template v-else-if="chosen.kind === 'registered' || chosen.kind === 'opensLater'">
        <span
          v-if="chosen.kind === 'registered'"
          class="w-fit rounded-pill bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-soft-text"
        >
          {{ $t('contests.actions.registeredBadge') }}
        </span>
        <button
          type="button"
          aria-disabled="true"
          class="inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-pill border border-line bg-surface-hover px-5 font-semibold text-content"
        >
          {{ $t('contests.actions.opensAt', { time: startClock }) }}
        </button>
      </template>
      <p v-else class="text-muted">{{ $t(`contests.actions.${chosen.kind}`) }}</p>
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
