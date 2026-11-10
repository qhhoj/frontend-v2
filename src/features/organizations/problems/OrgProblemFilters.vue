<script setup lang="ts">
import type { ProblemTag } from '@/api/types/organization-problems';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import SearchInput from '@/components/ui/SearchInput.vue';
import { formatNumber } from '@/lib/format';
import { useDebouncedText } from '@/lib/use-debounced-text';
import { useLocaleStore } from '@/stores/locale.store';
import { ARCHIVE_FILTERS } from './org-problem-filters';
import type { OrgProblemFilters } from './org-problems.queries';
import { TAG_DOT_CLASSES } from './org-tag-classes';

/** The toolbar (search left, the `actions` slot right: the one create), tag chips and the archive switch; every change goes to the URL through `change`. */
const props = defineProps<{
  filters: OrgProblemFilters;
  tags: ProblemTag[];
  total: number | null;
  isLoading: boolean;
}>();
const emit = defineEmits<{ change: [change: Partial<Omit<OrgProblemFilters, 'page'>>] }>();
const locale = useLocaleStore();
const text = useDebouncedText(
  () => props.filters.q,
  (value) => emit('change', { q: value }),
);
const CHIP =
  'inline-flex min-h-11 items-center gap-1.5 rounded-pill border border-line px-3 text-sm font-semibold hover:bg-surface-hover aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent-soft-text';
</script>

<template>
  <div class="flex flex-col gap-3" role="group" :aria-label="$t('orgProblems.filtersLabel')">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <SearchInput
        v-model="text"
        :label="$t('orgProblems.searchLabel')"
        :placeholder="$t('orgProblems.searchPlaceholder')"
        maxlength="50"
        class="w-full sm:w-80"
      />
      <div class="ml-auto"><slot name="actions" /></div>
    </div>
    <div class="flex flex-wrap gap-2" role="group" :aria-label="$t('orgProblems.tagFilter')">
      <button
        type="button"
        :class="CHIP"
        :aria-pressed="filters.tag === null"
        @click="emit('change', { tag: null })"
      >
        {{ $t('orgProblems.allTags') }}
      </button>
      <button
        v-for="tag in tags"
        :key="tag.id"
        type="button"
        :class="CHIP"
        :aria-pressed="filters.tag === tag.slug"
        @click="emit('change', { tag: tag.slug })"
      >
        <span
          aria-hidden="true"
          class="size-2.5 rounded-full"
          :class="TAG_DOT_CLASSES[tag.color]"
        />
        {{ tag.name }}
      </button>
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex flex-wrap gap-1" role="group" :aria-label="$t('orgProblems.archiveFilter')">
        <button
          v-for="option in ARCHIVE_FILTERS"
          :key="option"
          type="button"
          :class="CHIP"
          :aria-pressed="filters.archived === option"
          @click="emit('change', { archived: option })"
        >
          {{ $t(`orgProblems.archive.${option}`)
          }}<span
            v-if="filters.archived === option && (total !== null || isLoading)"
            class="text-muted"
          >
            ·
            <template v-if="total !== null">{{ formatNumber(total, locale.locale) }}</template
            ><SkeletonBlock v-else text class="w-[1ch]"
          /></span>
        </button>
      </div>
    </div>
  </div>
</template>
