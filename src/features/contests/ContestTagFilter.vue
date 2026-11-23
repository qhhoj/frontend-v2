<script setup lang="ts">
import type { ContestTag } from '@/api/types/contest-tags';
import InlineBit from '@/components/InlineBit.vue';
import AppButton from '@/components/ui/AppButton.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { EXTRAS_BITS } from './contest-extras-bits';
import type { TagFilterState } from './tag-chips';

defineProps<{
  tags: ContestTag[];
  selected: string | null;
  state: TagFilterState;
  isLoading: boolean;
  hasFailed: boolean;
}>();
const emit = defineEmits<{ select: [tag: string | null] }>();
const SKELETON_CHIPS = 5;
</script>

<template>
  <!-- A site without tags shows no chip row at all: no empty box under the title. -->
  <div
    v-if="hasFailed || isLoading || tags.length || state === 'unknown'"
    data-testid="tag-filter"
    class="flex min-w-0 flex-col gap-2"
  >
    <p
      v-if="hasFailed"
      data-testid="tag-failed"
      class="flex items-center gap-2.5 text-sm text-muted"
    >
      <InlineBit :kind="EXTRAS_BITS.tagNotice" />
      <span
        ><strong class="text-content">{{ $t('contestTags.failedTitle') }}</strong>
        {{ $t('contestTags.failedBody') }}</span
      >
    </p>
    <!-- Same box as the loaded nav (-mx-1 px-1 py-1), so the row keeps its height when the chips arrive. -->
    <div
      v-else-if="isLoading"
      aria-hidden="true"
      class="-mx-1 flex gap-2 overflow-hidden px-1 py-1"
    >
      <SkeletonBlock
        v-for="index in SKELETON_CHIPS"
        :key="index"
        data-skeleton-region="tag-chip"
        class="h-8 w-24 shrink-0"
      />
    </div>
    <nav
      v-else-if="tags.length"
      :aria-label="$t('contestTags.filterLabel')"
      class="-mx-1 overflow-x-auto px-1 py-1"
    >
      <ul class="m-0 flex w-max list-none gap-2 p-0 sm:w-auto sm:flex-wrap">
        <li>
          <AppButton
            size="sm"
            :pressed="selected === null || state === 'unknown'"
            @click="emit('select', null)"
          >
            {{ $t('contestTags.all') }}
          </AppButton>
        </li>
        <li v-for="tag in tags" :key="tag.slug">
          <AppButton
            size="sm"
            :pressed="selected === tag.slug"
            :title="tag.description || undefined"
            @click="emit('select', tag.slug)"
          >
            {{ tag.name }}
          </AppButton>
        </li>
      </ul>
    </nav>
    <p
      v-if="state === 'unknown'"
      data-testid="tag-unknown"
      role="status"
      class="flex items-center gap-2.5 text-sm"
    >
      <InlineBit :kind="EXTRAS_BITS.tagNotice" />
      <span
        ><strong>{{ $t('contestTags.unknownTitle', { slug: selected }) }}</strong>
        {{ $t('contestTags.unknownBody', { slug: selected }) }}</span
      >
    </p>
  </div>
</template>
