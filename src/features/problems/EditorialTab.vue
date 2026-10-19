<script setup lang="ts">
import { computed, toRef, watch } from 'vue';
import { ApiError } from '@/api/client';
import Card from '@/components/ui/Card.vue';
import Chip from '@/components/ui/Chip.vue';
import QueryState from '@/components/QueryState.vue';
import UserName from '@/components/UserName.vue';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import StatementBody from './StatementBody.vue';
import StatementSkeleton from './StatementSkeleton.vue';
import { useEditorialQuery } from './problems.queries';

/** Mounted only while the editorial tab is selected, so the answer is asked for then and no sooner. */
const props = defineProps<{ code: string }>();
/** The editorial is gone (404, e.g. a contest started): the page drops the tab. */
const emit = defineEmits<{ gone: [] }>();
const locale = useLocaleStore();
const {
  data: editorial,
  error,
  isPending,
  refetch,
} = useEditorialQuery(toRef(props, 'code'), toRef(locale, 'locale'));

const isGone = computed(() => error.value instanceof ApiError && error.value.status === 404);
watch(
  isGone,
  (gone) => {
    if (gone) emit('gone');
  },
  { immediate: true },
);
</script>

<template>
  <QueryState :loading="isPending" :error="isGone ? null : error" @retry="refetch()">
    <template #skeleton><StatementSkeleton /></template>
    <Card v-if="editorial" as="div" class="rounded-panel p-6 text-base sm:p-8">
      <p
        data-testid="editorial-meta"
        class="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted"
      >
        <span>
          {{ $t('problem.authors') }}
          <template v-for="(author, index) in editorial.authors" :key="author.id"
            ><template v-if="index">, </template
            ><UserName :username="author.username" :rating="author.rating"
          /></template>
        </span>
        <span>{{ formatDate(editorial.publishOn, 'date', locale.locale) }}</span>
        <Chip v-if="!editorial.isPublic" tone="accent" size="md">{{
          $t('problem.editorial.editorsOnly')
        }}</Chip>
      </p>
      <StatementBody :html="editorial.contentHtml" />
    </Card>
  </QueryState>
</template>
