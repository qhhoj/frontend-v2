<script setup lang="ts">
import { reactive, watch } from 'vue';
import { COMMENT_PAGE_TYPES } from '@/api/types/comments';
import { ADMIN_BUTTON_CLASS, ADMIN_INPUT_CLASS } from '../ui/classes';
import { COMMENT_STATES } from './admin-comments';
import type { CommentFilters } from './admin-comments';

/** The search form: edits a copy, so the list changes only on submit. */
const props = defineProps<{ filters: CommentFilters }>();
const emit = defineEmits<{ apply: [filters: CommentFilters] }>();
const draft = reactive<CommentFilters>({ ...props.filters });
watch(
  () => props.filters,
  (filters) => Object.assign(draft, filters),
);
const LABEL = 'flex flex-col gap-1.5 text-sm font-semibold';
</script>

<template>
  <form
    role="search"
    class="grid gap-3 rounded-panel border border-line bg-surface-solid p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end"
    @submit.prevent="emit('apply', { ...draft })"
  >
    <label :class="LABEL">
      {{ $t('admin.comments.all.filters.search') }}
      <input
        v-model="draft.search"
        type="search"
        maxlength="100"
        :class="[ADMIN_INPUT_CLASS, 'font-normal']"
        :placeholder="$t('admin.comments.all.filters.searchPlaceholder')"
      />
    </label>
    <label :class="LABEL">
      {{ $t('admin.comments.all.filters.author') }}
      <input
        v-model="draft.author"
        maxlength="100"
        autocomplete="off"
        :class="[ADMIN_INPUT_CLASS, 'font-normal']"
        :placeholder="$t('admin.comments.all.filters.authorPlaceholder')"
      />
    </label>
    <label :class="LABEL">
      {{ $t('admin.comments.all.filters.state') }}
      <select v-model="draft.state" :class="[ADMIN_INPUT_CLASS, 'font-normal']">
        <option v-for="state in COMMENT_STATES" :key="state" :value="state">
          {{ $t(`admin.comments.all.states.${state}`) }}
        </option>
      </select>
    </label>
    <label :class="LABEL">
      {{ $t('admin.comments.all.filters.pageType') }}
      <select v-model="draft.pageType" :class="[ADMIN_INPUT_CLASS, 'font-normal']">
        <option value="">{{ $t('admin.comments.all.pageTypes.any') }}</option>
        <option v-for="type in COMMENT_PAGE_TYPES" :key="type" :value="type">
          {{ $t(`admin.comments.all.pageTypes.${type}`) }}
        </option>
      </select>
    </label>
    <button type="submit" :class="ADMIN_BUTTON_CLASS">
      {{ $t('admin.comments.all.filters.submit') }}
    </button>
  </form>
</template>
