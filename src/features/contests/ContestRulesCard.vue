<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ContestDetail } from '@/api/types/contests';
import GlassCard from '@/components/GlassCard.vue';
import { useLocaleStore } from '@/stores/locale.store';
import { contestRules } from './contest-rules';
import type { RuleRow } from './contest-rules';

const props = defineProps<{ contest: ContestDetail }>();
const { t } = useI18n();
const locale = useLocaleStore();
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
</script>

<template>
  <GlassCard class="p-5">
    <h2 class="mb-3 font-display text-base font-bold">{{ $t('contests.rules.title') }}</h2>
    <dl class="flex flex-col gap-2.5 text-sm">
      <div
        v-for="rule in rules"
        :key="rule.termKey"
        class="grid grid-cols-[8rem_minmax(0,1fr)] gap-3"
      >
        <dt class="text-muted">{{ $t(rule.termKey) }}</dt>
        <dd>
          {{ valueText(rule) }}
        </dd>
      </div>
    </dl>
  </GlassCard>
</template>
