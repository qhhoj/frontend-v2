<script setup lang="ts">
import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { fetchAdminProblems } from '@/api/admin-index.api';
import { useDebouncedText } from '@/lib/use-debounced-text';
import { useLocaleStore } from '@/stores/locale.store';
import { ADMIN_INPUT_CLASS } from '../../ui/classes';

/** Shorter text matches too much to be worth a request. */
const MIN_SEARCH = 2;
const RESULTS = 8;

/**
 * Adds a problem: typing searches codes and names among the problems this account may see and lists the
 * matches to pick; Enter still adds the exact code typed.
 */
const props = defineProps<{
  listedIds: string[];
  isFull: boolean;
  isAdding: boolean;
  error: string;
  /** Adds the exact code; true when it was added, and only then the box clears. */
  addByCode: (code: string) => Promise<boolean>;
}>();
const emit = defineEmits<{ pick: [problem: { id: string; code: string; name: string }] }>();
const locale = useLocaleStore();
const searched = ref('');
const typed = useDebouncedText(
  () => searched.value,
  (text) => (searched.value = text),
);
const isSearching = computed(() => searched.value.length >= MIN_SEARCH && !props.isFull);
const { data, isFetching } = useQuery({
  queryKey: computed(() => ['admin', 'contest-problem-picker', locale.locale, searched.value]),
  // `editable: undefined` drops the index's default: a contest may list any problem its editor can see.
  queryFn: () =>
    fetchAdminProblems({
      q: searched.value,
      pageSize: RESULTS,
      lang: locale.locale,
      editable: undefined,
    }),
  enabled: isSearching,
  placeholderData: keepPreviousData,
});
const matches = computed(() => (isSearching.value ? (data.value?.items ?? []) : []));
function pick(problem: { id: string; code: string; name: string }) {
  emit('pick', problem);
  typed.commitNow('');
}
async function submit() {
  const code = typed.value.trim();
  if (code && (await props.addByCode(code))) typed.commitNow('');
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <label for="contest-add-problem" class="text-sm font-semibold">{{
      $t('admin.contests.problems.addLabel')
    }}</label>
    <input
      id="contest-add-problem"
      v-model="typed"
      type="search"
      :class="ADMIN_INPUT_CLASS"
      :placeholder="
        isFull ? $t('admin.contests.problems.full') : $t('admin.contests.problems.addPlaceholder')
      "
      :disabled="isFull || isAdding"
      :aria-describedby="error ? 'contest-add-problem-error' : 'contest-add-problem-hint'"
      aria-controls="contest-add-problem-results"
      autocomplete="off"
      spellcheck="false"
      @keydown.enter.prevent="submit"
    />
    <p id="contest-add-problem-hint" class="text-xs text-muted">
      {{ $t('admin.contests.problems.addHint') }}
    </p>
    <p v-if="error" id="contest-add-problem-error" class="text-sm text-negative">{{ error }}</p>
    <ul
      v-if="isSearching"
      id="contest-add-problem-results"
      class="flex flex-col divide-y divide-line rounded-row border border-line"
      :aria-busy="isFetching"
      :aria-label="$t('admin.contests.problems.matches')"
    >
      <li v-if="data && matches.length === 0" class="px-3 py-2 text-sm text-muted">
        {{ $t('admin.contests.problems.noMatch', { q: searched }) }}
      </li>
      <li v-for="problem in matches" :key="problem.id">
        <button
          type="button"
          class="flex min-h-11 w-full flex-wrap items-center gap-x-3 px-3 py-2 text-left text-sm hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="listedIds.includes(problem.id)"
          @click="pick(problem)"
        >
          <span class="font-mono font-semibold">{{ problem.code }}</span>
          <span class="min-w-0 flex-1 truncate">{{ problem.name }}</span>
          <span v-if="listedIds.includes(problem.id)" class="text-xs text-muted">
            {{ $t('admin.contests.problems.listed') }}
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>
