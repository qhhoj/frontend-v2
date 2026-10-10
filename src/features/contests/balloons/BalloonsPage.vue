<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { BALLOON_PAGE_SIZE } from '@/api/balloons.api';
import { ApiError } from '@/api/client';
import type { Balloon } from '@/api/types/contest-ops';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import InlineBit from '@/components/InlineBit.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import StatePanel from '@/components/StatePanel.vue';
import SubmissionPager from '@/features/submissions/SubmissionPager.vue';
import { translate } from '@/i18n';
import { usePageTitle } from '@/router/page-title';
import { EXTRAS_BITS } from '../contest-extras-bits';
import { useBalloonsQuery } from '../contest-extras.queries';
import { useContestQuery } from '../contests.queries';
import {
  BALLOON_STATES,
  balloonRowId,
  balloonStateOf,
  deliveryFailureKey,
  retryAfterOf,
} from './balloon-queue';
import BalloonRow from './BalloonRow.vue';
import { useBalloonDelivery } from './use-balloon-delivery';

const SKELETON_ROWS = 6;
const route = useRoute();
const router = useRouter();
const key = computed(() => String(route.params.key));
const state = computed(() => balloonStateOf(route.query.state));
const page = computed(() => Math.max(1, Number(route.query.page) || 1));
const { data: contest } = useContestQuery(key);
usePageTitle(() =>
  contest.value ? `${translate('balloons.title')} · ${contest.value.name}` : undefined,
);
const query = computed(() => ({
  state: state.value,
  page: page.value,
  pageSize: BALLOON_PAGE_SIZE,
}));
const { data: queue, error, isPending, refetch } = useBalloonsQuery(key, query);
const delivery = useBalloonDelivery(() => key.value);
const statusOf = (code: number) => error.value instanceof ApiError && error.value.status === code;
const isForbidden = computed(() => statusOf(403));
const isMissing = computed(() => statusOf(404));
const counts = computed(() => queue.value?.counts ?? { pendingTotal: null, deliveredTotal: null });
/** A volunteer during a freeze gets no times and no counts (the live ranking must not be rebuilt from them). */
const isHidden = computed(() => queue.value !== undefined && counts.value.pendingTotal === null);
const isAllDelivered = computed(
  () => state.value === 'pending' && (counts.value.deliveredTotal ?? 0) > 0,
);
const pendingAnnouncement = computed(() =>
  counts.value.pendingTotal === null
    ? ''
    : translate(
        'balloons.pendingCount',
        { count: counts.value.pendingTotal },
        counts.value.pendingTotal,
      ),
);

const root = ref<HTMLElement | null>(null);
/** Delivering drops the row from the pending list, taking the focused button with it: focus the row that took its place. */
async function toggleKeepingFocus(item: Balloon) {
  const index =
    queue.value?.items.findIndex((row) => balloonRowId(row) === balloonRowId(item)) ?? 0;
  await delivery.toggle(item);
  await nextTick();
  if (document.activeElement && document.activeElement !== document.body) return;
  const buttons = root.value?.querySelectorAll<HTMLElement>('[data-testid="balloon-row"] button');
  const target = buttons?.[Math.min(index, (buttons?.length ?? 1) - 1)];
  (target ?? root.value?.querySelector<HTMLElement>('[aria-pressed="true"]'))?.focus();
}
const go = (patch: Record<string, string | undefined>) =>
  void router.replace({ query: { ...route.query, page: undefined, ...patch } });
</script>

<template>
  <div ref="root" class="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-8">
    <StatePanel
      v-if="isMissing"
      kind="notFound"
      is-page-heading
      :title="$t('balloons.missingTitle')"
      :body="$t('balloons.missingBody')"
    />
    <StatePanel
      v-else-if="isForbidden"
      kind="forbidden"
      is-page-heading
      :title="$t('balloons.forbiddenTitle')"
      :body="$t('balloons.forbiddenBody')"
    />
    <template v-else>
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div class="flex min-w-0 items-center gap-3">
          <InlineBit :kind="EXTRAS_BITS.balloonsHeading" />
          <div class="min-w-0">
            <h1 class="page-title">{{ $t('balloons.title') }}</h1>
            <RouterLink
              :to="{ name: 'contest', params: { key } }"
              class="text-sm text-accent-text underline"
              >{{ contest?.name ?? key }}</RouterLink
            >
          </div>
        </div>
        <RouterLink
          :to="{ name: 'contest-balloons-print', params: { key } }"
          class="inline-flex min-h-11 items-center rounded-pill border border-line px-4 font-semibold hover:bg-surface-hover"
          >{{ $t('balloons.printLink') }}</RouterLink
        >
      </header>
      <p role="status" class="sr-only">{{ pendingAnnouncement }}</p>
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="option in BALLOON_STATES"
          :key="option"
          type="button"
          :aria-pressed="state === option"
          class="inline-flex min-h-11 items-center gap-2 rounded-pill border border-line px-4 text-sm font-semibold hover:bg-surface-hover aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent-soft-text"
          @click="go({ state: option === 'pending' ? undefined : option })"
        >
          {{ $t(`balloons.states.${option}`) }}
          <span
            v-if="option === 'pending' && counts.pendingTotal !== null"
            data-testid="pending-total"
            class="rounded-pill bg-surface-strong px-2"
            >{{ counts.pendingTotal }}</span
          >
          <span
            v-if="option === 'delivered' && counts.deliveredTotal !== null"
            data-testid="delivered-total"
            class="rounded-pill bg-surface-strong px-2"
            >{{ counts.deliveredTotal }}</span
          >
        </button>
      </div>
      <p v-if="isHidden" data-testid="balloons-frozen" class="text-sm text-muted">
        {{ $t('balloons.frozenNote') }}
      </p>
      <p
        v-if="delivery.failure.value"
        role="alert"
        data-testid="balloon-failure"
        class="flex items-center gap-2.5 text-verdict-wa"
      >
        <InlineBit :kind="EXTRAS_BITS.balloonRefused" /><span
          >{{ $t(deliveryFailureKey(delivery.failure.value))
          }}<template v-if="retryAfterOf(delivery.failure.value) !== null">
            {{
              $t('balloons.retryAfter', { seconds: retryAfterOf(delivery.failure.value) })
            }}</template
          ></span
        >
      </p>
      <QueryState :loading="isPending" :error="error" @retry="refetch()">
        <template #skeleton>
          <GlassCard as="div" data-region="balloon-list" class="flex flex-col gap-3 p-4">
            <SkeletonBlock
              v-for="index in SKELETON_ROWS"
              :key="index"
              data-skeleton-region="balloon-row"
              class="h-14 w-full"
            />
          </GlassCard>
        </template>
        <GlassCard v-if="queue && queue.items.length === 0" as="div">
          <EmptyState
            compact
            :kind="isAllDelivered ? EXTRAS_BITS.balloonsAllDelivered : EXTRAS_BITS.balloonsEmpty"
          >
            {{ isAllDelivered ? $t('balloons.allDelivered') : $t(`balloons.empty.${state}`) }}
          </EmptyState>
        </GlassCard>
        <GlassCard v-else-if="queue" as="div" data-region="balloon-list">
          <ul class="m-0 list-none p-0">
            <BalloonRow
              v-for="item in queue.items"
              :key="balloonRowId(item)"
              :balloon="item"
              :is-busy="delivery.busyId.value === balloonRowId(item)"
              @toggle="toggleKeepingFocus(item)"
            />
          </ul>
        </GlassCard>
        <SubmissionPager
          :page="page"
          :page-size="BALLOON_PAGE_SIZE"
          :total="queue?.total"
          :item-count="queue?.items.length ?? 0"
          @update:page="(target) => go({ page: target > 1 ? String(target) : undefined })"
        />
      </QueryState>
    </template>
  </div>
</template>
