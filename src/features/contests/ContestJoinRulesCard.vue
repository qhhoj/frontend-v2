<script setup lang="ts">
import Chip from '@/components/ui/Chip.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { computed, ref, useId } from 'vue';
import type { ContestDetail } from '@/api/types/contests';
import Card from '@/components/ui/Card.vue';
import InlineBit from '@/components/InlineBit.vue';
import UserContent from '@/components/UserContent.vue';
import { formatDate } from '@/lib/format-date';
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
  <Card v-if="isShown" data-testid="join-rules-card" class="flex flex-col gap-3 p-5">
    <div class="flex items-center gap-3">
      <InlineBit :kind="EXTRAS_BITS.rulesCard" />
      <h2 class="section-title">{{ $t('joinRules.cardTitle') }}</h2>
      <Chip size="md">{{ $t('joinRules.revision', { revision: contest.rulesRevision }) }}</Chip>
    </div>
    <p v-if="!isOpen" class="text-sm text-muted">{{ excerpt }}</p>
    <div v-else :id="bodyId" class="flex min-w-0">
      <UserContent :html="contest.rulesHtml" />
    </div>
    <AppButton
      :aria-expanded="isOpen"
      :aria-controls="isOpen ? bodyId : undefined"
      class="self-start"
      @click="isOpen = !isOpen"
    >
      {{ isOpen ? $t('joinRules.hide') : $t('joinRules.read') }}
    </AppButton>
    <p v-if="acceptance" class="text-sm font-semibold">
      {{
        $t('joinRules.accepted', {
          revision: acceptance.revision,
          time: formatDate(acceptance.at, 'datetime', locale.locale),
        })
      }}
    </p>
    <p v-else class="text-sm text-muted">{{ $t('joinRules.cardNote') }}</p>
  </Card>
</template>
