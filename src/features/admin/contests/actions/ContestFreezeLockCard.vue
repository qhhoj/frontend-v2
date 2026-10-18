<script setup lang="ts">
import { needsPermissionText } from '../../ui/permission-text';
import { computed, onBeforeUnmount, ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { updateContest } from '@/api/contest-editing.api';
import type { ContestPatch, EditableContest } from '@/api/types/contest-editing';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { translate } from '@/i18n';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import { usePermissions } from '@/stores/use-permissions';
import { useViewerId } from '@/stores/use-viewer-id';
import { failureTextOf } from '../../ui/admin-errors';
import { CARD, INPUT, buttonClass } from '../../ui/controls';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { freezeStateOf, isLockedNow } from '../contest-admin';
import {
  CONTEST_INDEX_KEY,
  editableContestKey,
  PUBLIC_CONTESTS_KEY,
} from '../contest-editing.queries';

/**
 * The ranking freeze and the submission lock as explicit actions over the same fields the General tab edits
 * (`frozenLastMinutes`, `lockedAfter`). Each change is confirmed: a freeze change rescores and re-rates, a lock is copied onto
 * every live submission.
 */
const props = defineProps<{ contest: EditableContest }>();
const locale = useLocaleStore();
const viewer = useViewerId();
const queryClient = useQueryClient();
const { can } = usePermissions();
/** The clock the states are read against, moved on every half minute so a scheduled freeze or lock turns on in place. */
const now = ref(Date.now());
const clock = setInterval(() => (now.value = Date.now()), 30_000);
onBeforeUnmount(() => clearInterval(clock));
const freeze = computed(() => freezeStateOf(props.contest, now.value));
const lockedAfter = computed(() => props.contest.settings?.lockedAfter ?? null);
const isLocked = computed(() => isLockedNow(lockedAfter.value, now.value));
const freezeMinutes = ref(60);

type Pending = { patch: ContestPatch; title: string; body: string; label: string } | null;
const pending = ref<Pending>(null);
const isOpen = computed({
  get: () => pending.value !== null,
  set: (open) => {
    if (!open) pending.value = null;
  },
});

const mutation = useAdminMutation({
  mutate: (patch: ContestPatch) => updateContest(props.contest.key, patch),
  invalidates: () => [PUBLIC_CONTESTS_KEY, CONTEST_INDEX_KEY],
  successText: () => translate('admin.ui.saved'),
  onSuccess: (saved: EditableContest) =>
    queryClient.setQueryData(editableContestKey(saved.key, viewer.value), saved),
  onDone: () => {
    pending.value = null;
    now.value = Date.now();
  },
});

/** Opens the confirm for one change; the keys name the title, body and button under `admin.contestOps.freezeLock`. */
function ask(patch: ContestPatch, action: string) {
  mutation.reset();
  now.value = Date.now();
  const text = (part: string) => translate(`admin.contestOps.freezeLock.${action}.${part}`);
  pending.value = { patch, title: text('title'), body: text('body'), label: text('confirm') };
}

const freezeLine = computed(() => {
  const state = freeze.value;
  const key = `admin.contestOps.freezeLock.freezeState.${state.kind}`;
  if (state.kind === 'scheduled')
    return translate(key, { time: formatDate(state.at.toISOString(), 'datetime', locale.locale) });
  if (state.kind === 'frozen')
    return translate(key, {
      time: formatDate(state.since.toISOString(), 'datetime', locale.locale),
    });
  return translate(key);
});
const lockLine = computed(() => {
  if (lockedAfter.value === null) return translate('admin.contestOps.freezeLock.lockState.off');
  const time = formatDate(lockedAfter.value, 'datetime', locale.locale);
  return translate(
    `admin.contestOps.freezeLock.lockState.${isLocked.value ? 'locked' : 'scheduled'}`,
    { time },
  );
});
const isFreezeValid = computed(
  () => Number.isInteger(freezeMinutes.value) && freezeMinutes.value > 0,
);
</script>

<template>
  <section data-testid="action-freeze-lock" :class="[CARD, 'flex flex-col gap-4 p-5']">
    <h3 class="m-0 text-base font-semibold">
      {{ $t('admin.contestOps.freezeLock.title') }}
    </h3>
    <div class="grid gap-5 md:grid-cols-2">
      <div class="flex flex-col gap-2" data-testid="freeze-state">
        <h4 class="font-semibold">{{ $t('admin.contestOps.freezeLock.freezeHeading') }}</h4>
        <p class="text-sm">{{ freezeLine }}</p>
        <button
          v-if="freeze.kind === 'frozen' || freeze.kind === 'scheduled'"
          type="button"
          :class="buttonClass('secondary')"
          class="self-start"
          @click="ask({ frozenLastMinutes: 0 }, 'unfreeze')"
        >
          {{ $t('admin.contestOps.freezeLock.unfreeze.button') }}
        </button>
        <div v-else-if="freeze.kind === 'off'" class="flex flex-wrap items-end gap-2">
          <div class="flex flex-col gap-1.5">
            <label for="freeze-minutes" class="text-sm font-semibold">
              {{ $t('admin.contestOps.freezeLock.minutesLabel') }}
            </label>
            <input
              id="freeze-minutes"
              v-model.number="freezeMinutes"
              type="number"
              min="1"
              :class="INPUT"
              class="w-28"
            />
          </div>
          <button
            type="button"
            :class="buttonClass('secondary')"
            :aria-disabled="!isFreezeValid || undefined"
            @click="isFreezeValid && ask({ frozenLastMinutes: freezeMinutes }, 'refreeze')"
          >
            {{ $t('admin.contestOps.freezeLock.refreeze.button') }}
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-2" data-testid="lock-state">
        <h4 class="font-semibold">{{ $t('admin.contestOps.freezeLock.lockHeading') }}</h4>
        <p class="text-sm">{{ lockLine }}</p>
        <p v-if="!can('judge.lock_contest')" class="text-sm text-muted">
          {{ needsPermissionText('judge.lock_contest') }}
        </p>
        <button
          v-else-if="lockedAfter !== null"
          type="button"
          :class="buttonClass('secondary')"
          class="self-start"
          @click="ask({ lockedAfter: null }, 'unlock')"
        >
          {{ $t('admin.contestOps.freezeLock.unlock.button') }}
        </button>
        <button
          v-if="can('judge.lock_contest') && !isLocked"
          type="button"
          :class="buttonClass('secondary')"
          class="self-start"
          @click="ask({ lockedAfter: new Date().toISOString() }, 'lock')"
        >
          {{ $t('admin.contestOps.freezeLock.lock.button') }}
        </button>
      </div>
    </div>

    <ConfirmDialog
      v-model:visible="isOpen"
      :title="pending?.title ?? ''"
      :body="pending?.body"
      :confirm-label="pending?.label ?? ''"
      tone="neutral"
      :busy="mutation.isPending.value"
      @confirm="pending && mutation.run(pending.patch)"
    >
      <template #error>
        <p v-if="mutation.failure.value" role="alert" class="text-sm text-negative">
          {{ failureTextOf(mutation.failure.value) }}
        </p>
      </template>
    </ConfirmDialog>
  </section>
</template>
