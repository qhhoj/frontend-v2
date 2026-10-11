<script setup lang="ts">
import { computed, ref } from 'vue';
import type { EditableContest } from '@/api/types/contest-editing';
import type { FeedKeyMode } from '@/api/types/contest-ops';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatDateTime } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import AdminBit from '../../shell/AdminBit.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { CARD, INPUT, buttonClass } from '../../ui/controls';
import { useFeedKeyStatusQuery } from '../contest-ops.queries';
import { canRelease, DEFAULT_FEED_KEY_DAYS, isValidKeyDays, MAX_FEED_KEY_DAYS } from './feed-key';
import FeedKeyRevealDialog from './FeedKeyRevealDialog.vue';
import { useFeedKeyActions } from './use-feed-key-actions';

type FeedAction = 'mint' | 'revoke' | 'release';
const MODES: FeedKeyMode[] = ['frozen-until-release', 'live'];
const RELEASE_CHECK_MS = 30_000;

const props = defineProps<{ contest: EditableContest }>();
const session = useSessionStore();
const locale = useLocaleStore();
const now = useNow(RELEASE_CHECK_MS);
const { data: status, isPending, error, refetch } = useFeedKeyStatusQuery(() => props.contest.key);
const actions = useFeedKeyActions(() => props.contest.key);
const mode = ref<FeedKeyMode>('frozen-until-release');
const days = ref(DEFAULT_FEED_KEY_DAYS);
const pending = ref<FeedAction | null>(null);
/** Minting, revoking and releasing are session-only and refused while viewing as someone else (403): not offered then. */
const isImpersonating = computed(() => session.impersonatorId !== null);
const mayRelease = computed(() =>
  status.value ? canRelease(status.value, props.contest, now.value) : false,
);
const MUTATIONS = { mint: actions.mint, revoke: actions.revoke, release: actions.release };
const isConfirmOpen = computed({
  get: () => pending.value !== null,
  set: (isOpen: boolean) => {
    if (!isOpen) pending.value = null;
  },
});
const isRevealOpen = computed({
  get: () => actions.minted.value !== null,
  set: (isOpen: boolean) => {
    if (!isOpen) actions.forgetMinted();
  },
});
const failure = computed(() => (pending.value ? MUTATIONS[pending.value].failure.value : null));

function ask(action: FeedAction) {
  if (action === 'mint' && !isValidKeyDays(days.value)) return;
  MUTATIONS[action].reset();
  pending.value = action;
}
async function confirm() {
  const action = pending.value;
  if (!action) return;
  if (action === 'mint') await actions.mint.run({ mode: mode.value, expiresInDays: days.value });
  else await MUTATIONS[action].run(undefined);
  if (!MUTATIONS[action].failure.value) pending.value = null;
}
const at = (date: string | null) => (date ? formatDateTime(date, locale.locale) : '—');
</script>

<template>
  <section data-testid="feed-key-card" :class="[CARD, 'flex flex-col gap-4 p-5']">
    <header class="flex flex-col gap-1">
      <h3 class="m-0 text-base font-semibold">{{ $t('admin.contestData.feed.title') }}</h3>
      <p class="text-sm text-muted">{{ $t('admin.contestData.feed.description') }}</p>
    </header>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <SkeletonBlock data-skeleton-region="feed-status" class="h-40 w-full" />
      </template>
      <dl
        v-if="status?.isActive"
        data-testid="feed-status"
        class="grid grid-cols-[8rem_minmax(0,1fr)] gap-2 text-sm"
      >
        <dt class="text-muted">{{ $t('admin.contestData.feed.status.mode') }}</dt>
        <dd>{{ $t(`admin.contestData.feed.modes.${status.mode}`) }}</dd>
        <dt class="text-muted">{{ $t('admin.contestData.feed.status.expiresAt') }}</dt>
        <dd>{{ at(status.expiresAt) }}</dd>
        <dt class="text-muted">{{ $t('admin.contestData.feed.status.createdBy') }}</dt>
        <dd>{{ status.createdBy ?? '—' }}</dd>
        <dt class="text-muted">{{ $t('admin.contestData.feed.status.releasedAt') }}</dt>
        <dd>{{ at(status.releasedAt) }}</dd>
      </dl>
      <p v-else data-testid="feed-status" class="text-sm text-muted">
        {{ $t('admin.contestData.feed.none') }}
      </p>
    </QueryState>
    <p v-if="isImpersonating" class="flex items-center gap-2.5 text-sm">
      <AdminBit placement="security" />{{ $t('admin.contestData.feed.impersonating') }}
    </p>
    <template v-else>
      <fieldset class="flex flex-col gap-2">
        <legend class="mb-1 text-sm font-semibold">
          {{ $t('admin.contestData.feed.modeLabel') }}
        </legend>
        <label v-for="option in MODES" :key="option" class="flex min-h-11 items-start gap-3">
          <input
            v-model="mode"
            type="radio"
            name="feed-key-mode"
            :value="option"
            class="mt-1 size-5"
          />
          <span>
            <span class="block font-semibold">{{
              $t(`admin.contestData.feed.modes.${option}`)
            }}</span>
            <span class="block text-sm text-muted">{{
              $t(`admin.contestData.feed.modeHints.${option}`)
            }}</span>
          </span>
        </label>
      </fieldset>
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-semibold">{{
          $t('admin.contestData.feed.days', { max: MAX_FEED_KEY_DAYS })
        }}</span>
        <input
          v-model.number="days"
          type="number"
          min="1"
          :max="MAX_FEED_KEY_DAYS"
          step="1"
          :class="[INPUT, 'max-w-32']"
          :aria-invalid="!isValidKeyDays(days) || undefined"
        />
      </label>
      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          :class="buttonClass('primary')"
          :aria-disabled="!isValidKeyDays(days) || undefined"
          @click="ask('mint')"
        >
          {{
            status?.isActive
              ? $t('admin.contestData.feed.mintAgain')
              : $t('admin.contestData.feed.mint')
          }}
        </button>
        <button
          v-if="status?.isActive"
          type="button"
          :class="buttonClass('danger')"
          @click="ask('revoke')"
        >
          {{ $t('admin.contestData.feed.revoke') }}
        </button>
        <button
          v-if="mayRelease"
          type="button"
          :class="buttonClass('secondary')"
          @click="ask('release')"
        >
          {{ $t('admin.contestData.feed.release') }}
        </button>
      </div>
      <AdminStatus
        v-if="actions.release.isDone.value"
        kind="done"
        :text="$t('admin.contestData.feed.released')"
      />
    </template>
    <ConfirmDialog
      v-model:visible="isConfirmOpen"
      :title="pending ? $t(`admin.contestData.feed.confirm.${pending}.title`) : ''"
      :body="pending ? $t(`admin.contestData.feed.confirm.${pending}.body`) : ''"
      :confirm-label="pending ? $t(`admin.contestData.feed.confirm.${pending}.label`) : ''"
      :tone="pending === 'mint' ? 'neutral' : 'danger'"
      :busy="pending ? MUTATIONS[pending].isPending.value : false"
      @confirm="confirm"
    >
      <template #error>
        <p v-if="failure" role="alert" class="text-sm text-negative">
          {{ failureTextOf(failure) }}
        </p>
      </template>
    </ConfirmDialog>
    <FeedKeyRevealDialog
      v-if="actions.minted.value"
      v-model:visible="isRevealOpen"
      :minted="actions.minted.value"
      :contest-key="contest.key"
    />
  </section>
</template>
