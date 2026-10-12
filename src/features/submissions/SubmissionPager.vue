<script setup lang="ts">
import { computed } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';

/** `total` is optional in the API: without it only a full page tells that a next one may exist. */
const props = defineProps<{
  page: number;
  pageSize: number;
  total: number | undefined;
  itemCount: number;
}>();
const emit = defineEmits<{ 'update:page': [page: number] }>();

const pageCount = computed(() =>
  props.total === undefined ? undefined : Math.max(1, Math.ceil(props.total / props.pageSize)),
);
const hasPrevious = computed(() => props.page > 1);
const hasNext = computed(() =>
  pageCount.value === undefined ? props.itemCount >= props.pageSize : props.page < pageCount.value,
);
const isHidden = computed(() => !hasPrevious.value && !hasNext.value);
</script>

<template>
  <nav
    v-if="!isHidden"
    :aria-label="$t('submissions.pager.label')"
    class="flex items-center justify-center gap-4 pt-4"
  >
    <AppButton
      data-direction="previous"
      :disabled="!hasPrevious"
      @click="emit('update:page', page - 1)"
    >
      {{ $t('submissions.pager.previous') }}
    </AppButton>
    <span class="font-mono text-sm tabular-nums">{{
      pageCount === undefined
        ? $t('submissions.pager.positionOpen', { page })
        : $t('submissions.pager.position', { page, total: pageCount })
    }}</span>
    <AppButton data-direction="next" :disabled="!hasNext" @click="emit('update:page', page + 1)">
      {{ $t('submissions.pager.next') }}
    </AppButton>
  </nav>
</template>
