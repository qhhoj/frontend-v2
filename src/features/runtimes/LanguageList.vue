<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import type { RuntimeJudge, RuntimeLanguage } from '@/api/types/runtimes';
import Card from '@/components/ui/Card.vue';
import LanguageRow from './LanguageRow.vue';

const props = defineProps<{ languages: RuntimeLanguage[]; judges: RuntimeJudge[] }>();
const search = ref('');
const openKey = ref<string | null>(null);
const shown = computed(() => {
  const needle = search.value.trim().toLowerCase();
  return props.languages.filter(
    (language) =>
      !needle ||
      language.name.toLowerCase().includes(needle) ||
      language.key.toLowerCase().includes(needle),
  );
});
const toggle = (key: string) => (openKey.value = openKey.value === key ? null : key);
</script>

<template>
  <Card class="overflow-hidden rounded-panel">
    <header
      class="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-6"
    >
      <h2 class="font-display text-xl font-bold">
        {{ $t('runtimes.languages') }}
        <span class="text-sm font-normal text-muted">({{ languages.length }})</span>
      </h2>
      <label class="relative flex items-center">
        <Search aria-hidden="true" class="pointer-events-none absolute left-3 size-4 text-muted" />
        <input
          v-model="search"
          type="search"
          :aria-label="$t('runtimes.search')"
          :placeholder="$t('runtimes.search')"
          class="min-h-11 rounded-pill border border-line-strong bg-surface-solid pr-4 pl-9 text-sm"
        />
      </label>
    </header>
    <ul v-if="shown.length">
      <LanguageRow
        v-for="language in shown"
        :key="language.key"
        :language="language"
        :judges="judges"
        :is-open="openKey === language.key"
        @toggle="toggle(language.key)"
      />
    </ul>
    <p v-else class="px-6 py-6 text-muted">{{ $t('runtimes.noMatch') }}</p>
  </Card>
</template>
