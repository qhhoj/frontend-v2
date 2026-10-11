<script setup lang="ts">
import UserLink from '@/components/UserLink.vue';
import { computed } from 'vue';
import type { JoinRequest } from '@/api/types/organizations';
import { formatAgo } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';

/** One join request: who asked, when, why; pending ones carry the decision buttons, decided ones name the decider. */
const props = defineProps<{ request: JoinRequest; deciderName: string; busy: boolean }>();
const emit = defineEmits<{ decide: [state: 'A' | 'R'] }>();
const locale = useLocaleStore();
const isPending = computed(() => props.request.state === 'P');
const decidedKey = computed(() =>
  props.request.state === 'A' ? 'orgMembership.approvedBy' : 'orgMembership.rejectedBy',
);
const decidedAgo = computed(() =>
  formatAgo(props.request.decidedAt ?? props.request.createdAt, Date.now(), locale.locale),
);
const askedAgo = computed(() => formatAgo(props.request.createdAt, Date.now(), locale.locale));
</script>

<template>
  <article
    class="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5"
  >
    <div class="flex min-w-0 flex-1 flex-col gap-1.5">
      <div class="flex flex-wrap items-center gap-2">
        <UserLink :username="request.username" size="sm" />
        <span class="text-sm text-muted">{{ askedAgo }}</span>
      </div>
      <p class="whitespace-pre-line break-words text-sm">{{ request.reason }}</p>
      <p v-if="!isPending" class="text-sm text-muted">
        <span class="mr-2 rounded-pill bg-surface-hover px-2 font-semibold text-content">{{
          $t(`orgMembership.states.${request.state}`)
        }}</span>
        {{ decidedAgo }} · {{ $t(decidedKey, { admin: deciderName }) }}
      </p>
    </div>
    <div v-if="isPending" class="flex shrink-0 gap-2">
      <button
        type="button"
        data-testid="reject"
        :aria-busy="busy"
        class="inline-flex min-h-11 items-center rounded-pill border border-line px-4 font-semibold hover:bg-surface-hover"
        @click="emit('decide', 'R')"
      >
        {{ $t('orgMembership.reject') }}
      </button>
      <button
        type="button"
        data-testid="approve"
        :aria-busy="busy"
        class="inline-flex min-h-11 items-center rounded-pill bg-accent px-4 font-semibold text-on-accent"
        @click="emit('decide', 'A')"
      >
        {{ $t('orgMembership.approve') }}
      </button>
    </div>
  </article>
</template>
