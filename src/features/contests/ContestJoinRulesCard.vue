<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import type { ContestDetail } from '@/api/types/contests';
import GlassCard from '@/components/GlassCard.vue';
import InlineBit from '@/components/InlineBit.vue';
import UserContent from '@/components/UserContent.vue';
import { formatDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { EXTRAS_BITS } from './contest-extras-bits';
import { hasRules, rulesExcerpt } from './join-rules';
import type { RulesAcceptance } from './join-rules';

/** `acceptance` is the revision the viewer's live participation accepted; null or absent shows the note instead. */
const props = defineProps<{
  contest: ContestDetail;
  acceptance?: RulesAcceptance | null;
}>();
const isOpen = ref(false);
const bodyId = useId();
const locale = useLocaleStore();
const isShown = computed(() => hasRules(props.contest.rules));
const excerpt = computed(() => rulesExcerpt(props.contest.rules));
</script>

<template>
  <GlassCard v-if="isShown" data-testid="join-rules-card" class="flex flex-col gap-3 p-5">
    <div class="flex items-center gap-3">
      <InlineBit :kind="EXTRAS_BITS.rulesCard" />
      <h2 class="font-display text-lg font-semibold">{{ $t('joinRules.cardTitle') }}</h2>
      <span class="rounded-pill bg-surface-strong px-2.5 text-sm font-semibold">{{
        $t('joinRules.revision', { revision: contest.rulesRevision })
      }}</span>
    </div>
    <p v-if="!isOpen" class="text-sm text-muted">{{ excerpt }}</p>
    <div v-else :id="bodyId" class="flex min-w-0">
      <UserContent :html="contest.rulesHtml" />
    </div>
    <button
      type="button"
      :aria-expanded="isOpen"
      :aria-controls="isOpen ? bodyId : undefined"
      class="inline-flex min-h-11 items-center self-start rounded-pill border border-line px-4 font-semibold hover:bg-surface-hover"
      @click="isOpen = !isOpen"
    >
      {{ isOpen ? $t('joinRules.hide') : $t('joinRules.read') }}
    </button>
    <p v-if="acceptance" class="text-sm font-semibold">
      {{
        $t('joinRules.accepted', {
          revision: acceptance.revision,
          time: formatDateTime(acceptance.at, locale.locale),
        })
      }}
    </p>
    <p v-else class="text-sm text-muted">{{ $t('joinRules.cardNote') }}</p>
  </GlassCard>
</template>
