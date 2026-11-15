<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ContestDetail } from '@/api/types/contests';
import Card from '@/components/ui/Card.vue';
import FoldPanel from '@/components/ui/FoldPanel.vue';
import { useLocaleStore } from '@/stores/locale.store';
import { contestRules } from './contest-rules';
import type { RuleRow } from './contest-rules';

const props = defineProps<{ contest: ContestDetail }>();
const { t } = useI18n();
const locale = useLocaleStore();
/** Closed until the header is clicked; the rows slide open in a `FoldPanel`. */
const isOpen = ref(false);
const panelId = useId();
const rules = computed(() => contestRules(props.contest, locale.locale));

/** Params that are message keys (the scoreboard visibility) are translated before they fill the sentence. */
function valueText(rule: RuleRow): string {
  const translatedParams = Object.fromEntries(
    Object.entries(rule.paramKeys ?? {}).map(([name, key]) => [name, t(key)]),
  );
  const count = typeof rule.params.count === 'number' ? rule.params.count : 1;
  const value = t(rule.valueKey, { ...rule.params, ...translatedParams }, count);
  return rule.suffixKey ? `${value} ${t(rule.suffixKey)}` : value;
}

/** The collapsed line shows the first rows' values (format, scoreboard, rating); the rest waits for the click. */
const SUMMARY_ROWS = 3;
const summary = computed(() =>
  rules.value
    .slice(0, SUMMARY_ROWS)
    .map((rule) => valueText(rule))
    .join(' · '),
);
</script>

<template>
  <Card as="div" class="px-5 py-3">
    <button
      type="button"
      class="flex min-h-8 w-full items-center gap-2 text-left text-sm"
      :aria-expanded="isOpen"
      :aria-controls="panelId"
      @click="isOpen = !isOpen"
    >
      <span class="shrink-0 font-semibold">{{ $t('contests.rules.title') }}</span>
      <span class="min-w-0 flex-1 truncate text-muted" :class="isOpen && 'invisible'">{{
        summary
      }}</span>
      <span class="shrink-0 text-accent-text">
        {{ isOpen ? `${$t('contests.rules.hide')} ▾` : `${$t('contests.rules.show')} ▸` }}
      </span>
    </button>
    <FoldPanel :id="panelId" :open="isOpen">
      <dl class="mt-3 flex flex-col gap-2.5 text-sm">
        <div
          v-for="rule in rules"
          :key="rule.termKey"
          class="grid grid-cols-[8rem_minmax(0,1fr)] gap-3"
        >
          <dt class="text-muted">{{ $t(rule.termKey) }}</dt>
          <dd>{{ valueText(rule) }}</dd>
        </div>
      </dl>
    </FoldPanel>
  </Card>
</template>
