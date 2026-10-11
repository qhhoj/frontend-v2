<script setup lang="ts">
import { useContestTagsQuery } from '@/features/contests/contest-extras.queries';
import AdminField from '../../ui/AdminField.vue';
import { INPUT } from '../../ui/controls';
import {
  CONTEST_RATED_FILTERS,
  CONTEST_SCOPE_FILTERS,
  CONTEST_SORTS,
} from './contest-list-filters';
import type { ContestFilterPatch, ContestListFilters } from './contest-list-filters';

/** The "Bộ lọc" panel of the staff contest list: scope, tag, rating, sort and start dates; every change lands in the address. */
defineProps<{ filters: ContestListFilters }>();
const emit = defineEmits<{ change: [patch: ContestFilterPatch] }>();
const { data: tags } = useContestTagsQuery();
const valueOf = (event: Event) => (event.target as HTMLInputElement | HTMLSelectElement).value;
const set = (field: keyof ContestFilterPatch, event: Event) =>
  emit('change', { [field]: valueOf(event) });
</script>

<template>
  <AdminField v-slot="{ id }" :label="$t('admin.contests.list.scopeLabel')">
    <select :id="id" :class="INPUT" :value="filters.scope" @change="set('scope', $event)">
      <option v-for="scope in CONTEST_SCOPE_FILTERS" :key="scope" :value="scope">
        {{ $t(`admin.contests.list.scopes.${scope}`) }}
      </option>
    </select>
  </AdminField>
  <AdminField v-slot="{ id }" :label="$t('admin.contests.list.tagLabel')">
    <select :id="id" :class="INPUT" :value="filters.tag" @change="set('tag', $event)">
      <option value="">{{ $t('admin.contests.list.anyTag') }}</option>
      <option v-for="tag in tags ?? []" :key="tag.slug" :value="tag.slug">{{ tag.name }}</option>
    </select>
  </AdminField>
  <AdminField v-slot="{ id }" :label="$t('admin.contests.list.ratedLabel')">
    <select :id="id" :class="INPUT" :value="filters.rated" @change="set('rated', $event)">
      <option v-for="rated in CONTEST_RATED_FILTERS" :key="rated" :value="rated">
        {{ $t(`admin.contests.list.rated.${rated || 'any'}`) }}
      </option>
    </select>
  </AdminField>
  <AdminField v-slot="{ id }" :label="$t('admin.contests.list.sort')">
    <select :id="id" :class="INPUT" :value="filters.sort" @change="set('sort', $event)">
      <option v-for="sort in CONTEST_SORTS" :key="sort" :value="sort">
        {{ $t(`admin.contests.list.sorts.${sort || 'default'}`) }}
      </option>
    </select>
  </AdminField>
  <AdminField v-slot="{ id }" :label="$t('admin.contests.list.from')">
    <input
      :id="id"
      type="date"
      :class="INPUT"
      :value="filters.from"
      @change="set('from', $event)"
    />
  </AdminField>
  <AdminField v-slot="{ id }" :label="$t('admin.contests.list.before')">
    <input
      :id="id"
      type="date"
      :class="INPUT"
      :value="filters.before"
      @change="set('before', $event)"
    />
  </AdminField>
</template>
