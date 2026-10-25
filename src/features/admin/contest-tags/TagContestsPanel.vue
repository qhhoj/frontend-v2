<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { computed, ref, watch } from 'vue';
import { tagContests } from '@/api/contest-admin.api';
import { fetchContests } from '@/api/contests.api';
import type { BulkContestResult } from '@/api/types/contest-editing';
import type { ContestTag } from '@/api/types/contest-tags';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { translate } from '@/i18n';
import { useViewerId } from '@/stores/use-viewer-id';
import ContestBulkResult from '../contests/ContestBulkResult.vue';
import { CONTEST_INDEX_KEY, PUBLIC_CONTESTS_KEY } from '../contests/contest-editing.queries';
import { failureTextOf } from '../ui/admin-errors';
import AdminDrawer from '../ui/AdminDrawer.vue';
import { INPUT, buttonClass } from '../ui/controls';
import { useAdminMutation } from '../ui/use-admin-mutation';
import { checked, MAX_BULK_ROWS, useRowSelection } from '../ui/use-row-selection';

/** A drawer with the contests carrying `tag` that the viewer may edit: add more by key, or take the tag off ticked ones. */
const props = defineProps<{ tag: ContestTag }>();
const visible = defineModel<boolean>('visible', { required: true });
const viewerId = useViewerId();
const { data, isPending, error, refetch } = useQuery({
  queryKey: computed(() => [...CONTEST_INDEX_KEY, viewerId.value, 'tag', props.tag.slug]),
  queryFn: () => fetchContests({ tag: props.tag.slug, editable: true, pageSize: MAX_BULK_ROWS }),
});
const tagged = computed(() => data.value?.items ?? []);
const selection = useRowSelection(computed(() => tagged.value.map((contest) => contest.key)));
const keysText = ref('');
const lastResult = ref<BulkContestResult | null>(null);
watch(
  () => props.tag.slug,
  () => {
    keysText.value = '';
    lastResult.value = null;
    selection.clear();
  },
);
/** Keys typed apart by spaces, commas or lines; repeats count once. */
const typedKeys = computed(() => [
  ...new Set(keysText.value.split(/[\s,]+/).filter((key) => key !== '')),
]);

const mutation = useAdminMutation({
  mutate: (change: { keys: string[]; assigned: boolean }) =>
    tagContests({ ...change, tag: props.tag.slug }),
  invalidates: () => [CONTEST_INDEX_KEY, PUBLIC_CONTESTS_KEY, ['admin', 'contest']],
  successText: (result: BulkContestResult) =>
    translate('admin.contestTags.contests.done', { done: result.done }),
  onDone: (result: BulkContestResult, change) => {
    lastResult.value = result;
    if (change.assigned) keysText.value = '';
    else selection.clear();
  },
});
/** One run takes at most 100 keys: more are refused here, never cut silently. */
const isTooMany = computed(() => typedKeys.value.length > MAX_BULK_ROWS);
const add = () =>
  typedKeys.value.length > 0 &&
  !isTooMany.value &&
  mutation.run({ keys: typedKeys.value, assigned: true });
const removeSelected = () =>
  selection.selected.value.length > 0 &&
  mutation.run({ keys: selection.selected.value, assigned: false });
const resultRows = computed(() =>
  (lastResult.value?.results ?? []).map((item) => ({ ...item, name: item.key })),
);
</script>

<template>
  <AdminDrawer
    v-model:visible="visible"
    :title="$t('admin.contestTags.contests.title', { name: tag.name })"
    :subtitle="tag.slug"
  >
    <form class="flex flex-col gap-2" @submit.prevent="add">
      <label for="tag-contests-add" class="text-sm font-semibold">
        {{ $t('admin.contestTags.contests.addLabel') }}
      </label>
      <div class="flex flex-wrap gap-2">
        <input
          id="tag-contests-add"
          v-model="keysText"
          autofocus
          :class="[INPUT, 'min-w-0 flex-1 basis-56 font-mono']"
          :placeholder="$t('admin.contestTags.contests.addPlaceholder')"
          autocomplete="off"
          spellcheck="false"
        />
        <button
          type="submit"
          :class="buttonClass('primary')"
          :aria-disabled="
            typedKeys.length === 0 || isTooMany || mutation.isPending.value || undefined
          "
        >
          {{ $t('admin.contestTags.contests.add') }}
        </button>
      </div>
    </form>
    <p v-if="isTooMany" role="alert" class="text-sm text-negative">
      {{
        $t('admin.contestTags.contests.tooMany', { count: typedKeys.length, max: MAX_BULK_ROWS })
      }}
    </p>
    <p v-if="mutation.failure.value" role="alert" class="text-sm text-negative">
      {{ failureTextOf(mutation.failure.value) }}
    </p>
    <ContestBulkResult
      v-if="lastResult && lastResult.failed > 0"
      :results="resultRows"
      reason-prefix="admin.contests.bulk.reasons"
    />
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <SkeletonBlock data-skeleton-region="tag-contests" class="h-24 w-full rounded-row" />
      </template>
      <p v-if="tagged.length === 0" class="text-sm text-muted">
        {{ $t('admin.contestTags.contests.none') }}
      </p>
      <div v-else class="flex flex-col gap-2">
        <label class="flex min-h-10 items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            class="size-4 accent-accent"
            :checked="selection.isAllSelected.value"
            :indeterminate="selection.isSomeSelected.value"
            @change="selection.toggleAll(checked($event))"
          />
          {{ $t('admin.contestTags.contests.listed', { count: data?.meta.total ?? 0 }) }}
        </label>
        <ul
          class="m-0 flex list-none flex-col divide-y divide-line rounded-row border border-line p-0"
        >
          <li v-for="contest in tagged" :key="contest.key">
            <label
              class="flex min-h-10 items-center gap-3 px-3 py-2 text-sm hover:bg-surface-hover"
            >
              <input
                type="checkbox"
                class="size-4 shrink-0 accent-accent"
                :checked="selection.isSelected(contest.key)"
                @change="selection.toggle(contest.key, checked($event))"
              />
              <span class="shrink-0 font-mono font-semibold">{{ contest.key }}</span>
              <span class="min-w-0 truncate text-muted">{{ contest.name }}</span>
            </label>
          </li>
        </ul>
      </div>
    </QueryState>
    <template v-if="tagged.length > 0" #footer>
      <button
        type="button"
        :class="[buttonClass('secondary'), 'ml-auto']"
        :aria-disabled="
          selection.selected.value.length === 0 || mutation.isPending.value || undefined
        "
        @click="removeSelected"
      >
        {{
          $t('admin.contestTags.contests.removeSelected', {
            count: selection.selected.value.length,
          })
        }}
      </button>
    </template>
  </AdminDrawer>
</template>
