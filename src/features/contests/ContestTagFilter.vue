<script setup lang="ts">
import type { ContestTag } from '@/api/types/contest-tags';
import InlineBit from '@/components/InlineBit.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { EXTRAS_BITS } from './contest-extras-bits';
import type { TagFilterState } from './tag-chips';
import { TAG_COLOR_CLASSES } from './tag-colors';

defineProps<{
  tags: ContestTag[];
  selected: string | null;
  state: TagFilterState;
  isLoading: boolean;
  hasFailed: boolean;
}>();
const emit = defineEmits<{ select: [tag: string | null] }>();
/** 44 px: these chips are buttons (M4A: 26 px chips are only for display). */
const CHIP =
  'inline-flex min-h-11 items-center rounded-pill border px-4 text-sm font-semibold whitespace-nowrap hover:bg-surface-hover';
const PRESSED = 'border-current ring-1 ring-current ring-inset';
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
        pill
        class="h-11 w-24 shrink-0"
      />
    </div>
    <nav
      v-else-if="tags.length"
      :aria-label="$t('contestTags.filterLabel')"
      class="-mx-1 overflow-x-auto px-1 py-1"
    >
      <ul class="m-0 flex w-max list-none gap-2 p-0 sm:w-auto sm:flex-wrap">
        <li>
          <button
            type="button"
            :aria-pressed="selected === null || state === 'unknown'"
            :class="[
              CHIP,
              'border-line bg-surface-strong text-content',
              (selected === null || state === 'unknown') && PRESSED,
            ]"
            @click="emit('select', null)"
          >
            {{ $t('contestTags.all') }}
          </button>
        </li>
        <li v-for="tag in tags" :key="tag.slug">
          <button
            type="button"
            :aria-pressed="selected === tag.slug"
            :title="tag.description || undefined"
            :class="[CHIP, TAG_COLOR_CLASSES[tag.color], selected === tag.slug && PRESSED]"
            @click="emit('select', tag.slug)"
          >
            {{ tag.name }}
          </button>
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
