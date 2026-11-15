<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ContestDetail } from '@/api/types/contests';
import Card from '@/components/ui/Card.vue';
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
  <Card as="details" class="group px-5 py-3">
    <summary
      class="flex min-h-8 cursor-pointer list-none items-center gap-2 text-sm marker:hidden [&::-webkit-details-marker]:hidden"
    >
      <span class="shrink-0 font-semibold">{{ $t('contests.rules.title') }}</span>
      <span class="min-w-0 flex-1 truncate text-muted group-open:invisible">{{ summary }}</span>
      <span class="shrink-0 text-accent-text">
        <span class="group-open:hidden">{{ $t('contests.rules.show') }} ▸</span>
        <span class="hidden group-open:inline">{{ $t('contests.rules.hide') }} ▾</span>
      </span>
    </summary>
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
  </Card>
</template>
