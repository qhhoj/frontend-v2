<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ContestDetail } from '@/api/types/contests';
import InlineBit from '@/components/InlineBit.vue';
import Disclosure from '@/components/ui/Disclosure.vue';
import UserContent from '@/components/UserContent.vue';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import { EXTRAS_BITS } from './contest-extras-bits';
import { hasRules, rulesExcerpt } from './join-rules';
import type { RulesAcceptance } from './join-rules';

/**
 * The rules a contestant accepts on joining, folded to one line under the problems (the same fold as the format rules
 * beside it): the title, then what the viewer accepted, or the revision and the first words of the text. Opened, it
 * shows Bit, the whole text and the acceptance line or the note that joining asks for it.
 * `acceptance` is the revision the viewer's live participation accepted; null or absent shows the note instead.
 */
const props = defineProps<{
  contest: ContestDetail;
  acceptance?: RulesAcceptance | null;
}>();
const isOpen = ref(false);
const { t } = useI18n();
const locale = useLocaleStore();
const isShown = computed(() => hasRules(props.contest.rules));
const acceptedText = computed(() =>
  props.acceptance
    ? t('joinRules.accepted', {
        revision: props.acceptance.revision,
        time: formatDate(props.acceptance.at, 'datetime', locale.locale),
      })
    : null,
);
const summary = computed(
  () =>
    acceptedText.value ??
    `${t('joinRules.revision', { revision: props.contest.rulesRevision })} · ${rulesExcerpt(props.contest.rules)}`,
);
</script>

<template>
  <div v-if="isShown" data-testid="join-rules-card" class="border-b border-line">
    <Disclosure v-model:open="isOpen" :label="$t('joinRules.cardTitle')">
      <template #summary>
        <span
          data-testid="join-rules-summary"
          class="min-w-0 flex-1 truncate font-normal text-muted"
          :class="isOpen && 'invisible'"
          >{{ summary }}</span
        >
      </template>
      <div class="flex flex-col gap-3 pb-3">
        <div class="flex min-w-0 items-start gap-3">
          <InlineBit v-if="isOpen" :kind="EXTRAS_BITS.rulesCard" class="shrink-0" />
          <UserContent :html="contest.rulesHtml" class="min-w-0" />
        </div>
        <p v-if="acceptedText" class="text-sm font-semibold">{{ acceptedText }}</p>
        <p v-else class="text-sm text-muted">{{ $t('joinRules.cardNote') }}</p>
      </div>
    </Disclosure>
  </div>
</template>
