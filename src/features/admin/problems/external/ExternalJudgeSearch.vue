<script setup lang="ts">
import { ref } from 'vue';
import { Search } from 'lucide-vue-next';
import { searchExternalJudge } from '@/api/external-judge.api';
import type { ExternalJudgeSearchItem } from '@/api/types/external-judge';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { BUTTON } from '../../ui/controls';
import { useAdminMutation } from '../../ui/use-admin-mutation';

/** Searches the remote OJs by the typed OJ and problem id; a click on a result fills both fields. */
const props = defineProps<{ code: string; oj: string; problemId: string }>();
const emit = defineEmits<{ pick: [item: ExternalJudgeSearchItem] }>();
const items = ref<ExternalJudgeSearchItem[] | null>(null);
const total = ref(0);
const search = useAdminMutation({
  mutate: () =>
    searchExternalJudge(props.code, {
      ...(props.oj.trim() === '' ? {} : { oj: props.oj.trim() }),
      ...(props.problemId.trim() === '' ? {} : { problemId: props.problemId.trim() }),
    }),
  onSuccess: (answer) => {
    items.value = answer.items;
    total.value = answer.total;
  },
});
</script>

<template>
  <div class="flex flex-col gap-3">
    <div>
      <button
        type="button"
        :class="BUTTON.secondary"
        :aria-busy="search.isPending.value || undefined"
        @click="search.run(undefined)"
      >
        <Search aria-hidden="true" class="size-4" />{{ $t('admin.externalJudge.search.button') }}
      </button>
    </div>
    <AdminStatus
      v-if="search.failure.value"
      kind="refused"
      :text="failureTextOf(search.failure.value)"
    />
    <p v-else-if="items?.length === 0" class="text-sm text-muted">
      {{ $t('admin.externalJudge.search.empty') }}
    </p>
    <template v-else-if="items">
      <p class="text-xs text-muted">
        {{ $t('admin.externalJudge.search.total', { shown: items.length, total }) }}
      </p>
      <ul class="flex flex-col gap-1" data-testid="external-search-results">
        <li v-for="item in items" :key="`${item.oj}/${item.problemId}`">
          <button
            type="button"
            class="flex min-h-11 w-full flex-wrap items-baseline gap-x-3 rounded-row border border-line px-3 py-2 text-left hover:bg-surface-hover"
            @click="emit('pick', item)"
          >
            <span class="font-mono text-sm">{{ item.oj }} · {{ item.problemId }}</span>
            <span class="min-w-0 flex-1 [overflow-wrap:anywhere]">{{ item.title }}</span>
          </button>
        </li>
      </ul>
    </template>
  </div>
</template>
