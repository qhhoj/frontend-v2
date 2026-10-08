<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import { computed } from 'vue';
import { useDebouncedText } from '@/lib/use-debounced-text';
import ContestGroup from './ContestGroup.vue';
import { PHASE_ORDER, useContestListFilters } from './use-contest-list-filters';

const { filters, update } = useContestListFilters();
const search = useDebouncedText(
  () => filters.value.search,
  (text) => update({ search: text }),
);
const shownPhases = computed(() => (filters.value.phase ? [filters.value.phase] : PHASE_ORDER));
/** The select's values are the URL's: `rated=1` for the rated-only choice, none for both. */
const ratedChoice = computed({
  get: () => (filters.value.isRatedOnly ? 'rated' : 'any'),
  set: (choice: string) => update({ isRatedOnly: choice === 'rated' }),
});
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {{ $t('contests.title') }}
        </h1>
        <p class="mt-1 text-muted">{{ $t('contests.list.lead') }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2.5">
        <label class="glass flex h-12 items-center gap-2 rounded-pill px-4 text-muted">
          <span class="sr-only">{{ $t('contests.list.search') }}</span>
          <Search class="size-4 shrink-0" aria-hidden="true" />
          <input
            v-model="search"
            type="search"
            maxlength="100"
            :placeholder="$t('contests.list.searchPlaceholder')"
            class="min-h-11 w-56 bg-transparent text-content"
          />
        </label>
        <label class="flex items-center">
          <span class="sr-only">{{ $t('contests.list.ratedLabel') }}</span>
          <select v-model="ratedChoice" class="glass h-12 w-52 rounded-pill px-4 text-content">
            <option value="any">{{ $t('contests.list.ratedAny') }}</option>
            <option value="rated">{{ $t('contests.list.ratedOnly') }}</option>
          </select>
        </label>
      </div>
    </header>
    <ContestGroup v-for="phase in shownPhases" :key="phase" :phase="phase" :filters="filters" />
  </div>
</template>
