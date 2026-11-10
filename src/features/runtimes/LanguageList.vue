<script setup lang="ts">
import { computed, ref } from 'vue';
import type { RuntimeJudge, RuntimeLanguage } from '@/api/types/runtimes';
import { LANGUAGE_LOGO_LICENCES_URL } from '@/components/language/language-icons';
import EmptyState from '@/components/EmptyState.vue';
import AppButton from '@/components/ui/AppButton.vue';
import SearchInput from '@/components/ui/SearchInput.vue';
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
  <Card class="overflow-hidden">
    <header
      class="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-6"
    >
      <h2 class="section-title">
        {{ $t('runtimes.languages') }}
        <span class="text-sm font-normal text-muted">({{ languages.length }})</span>
      </h2>
      <SearchInput
        v-model="search"
        :label="$t('runtimes.search')"
        :placeholder="$t('runtimes.search')"
        class="w-full sm:w-64"
      />
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
    <EmptyState v-else compact>
      {{ $t('runtimes.noMatch') }}
      <template #action>
        <AppButton @click="search = ''">{{ $t('common.clearSearch') }}</AppButton>
      </template>
    </EmptyState>
    <p class="border-t border-line px-4 py-3 text-meta text-muted sm:px-6">
      {{ $t('runtimes.logoCredit') }}
      <a
        :href="LANGUAGE_LOGO_LICENCES_URL"
        target="_blank"
        rel="noopener"
        class="underline underline-offset-2 hover:no-underline"
        >{{ $t('runtimes.logoLicences') }}</a
      >
    </p>
  </Card>
</template>
