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
const RATED_CHOICES = [
  { isRatedOnly: false, labelKey: 'contests.list.ratedAny' },
  { isRatedOnly: true, labelKey: 'contests.list.ratedOnly' },
] as const;
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
            :placeholder="$t('contests.list.search')"
            class="min-h-11 w-44 bg-transparent text-content"
          />
        </label>
        <div
          role="group"
          :aria-label="$t('contests.list.ratedLabel')"
          class="glass flex rounded-pill p-1"
        >
          <button
            v-for="choice in RATED_CHOICES"
            :key="choice.labelKey"
            type="button"
            :aria-pressed="filters.isRatedOnly === choice.isRatedOnly"
            class="min-h-11 rounded-pill px-4 text-sm"
            :class="
              filters.isRatedOnly === choice.isRatedOnly
                ? 'bg-gradient-accent font-bold text-on-accent'
                : 'text-content hover:bg-surface-hover'
            "
            @click="update({ isRatedOnly: choice.isRatedOnly })"
          >
            {{ $t(choice.labelKey) }}
          </button>
        </div>
      </div>
    </header>
    <ContestGroup v-for="phase in shownPhases" :key="phase" :phase="phase" :filters="filters" />
  </div>
</template>
