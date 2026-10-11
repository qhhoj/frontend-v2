<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { translate } from '@/i18n';
import { useDebouncedText } from '@/lib/use-debounced-text';
import { ADMIN_INPUT_CLASS } from '../../ui/classes';
import { KIND_FILTERS, SORTS, STATUS_FILTERS } from './participant-filters';

/** The list filters, kept in the URL so a filtered view can be shared; any change starts again at page 1. */
const route = useRoute();
const router = useRouter();
const setQuery = (name: string, value: string) =>
  router.replace({ query: { ...route.query, [name]: value || undefined, page: undefined } });
const typedUser = useDebouncedText(
  () => String(route.query.user ?? ''),
  (text) => void setQuery('user', text),
);
const selectOf = (name: string) =>
  computed({
    get: () => String(route.query[name] ?? ''),
    set: (value: string) => void setQuery(name, value),
  });
const kind = selectOf('kind');
const status = selectOf('status');
const sort = selectOf('sort');
const label = (group: string, value: string) =>
  translate(`admin.contestOps.participants.filters.${group}.${value || 'all'}`);
</script>

<template>
  <div class="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-wrap sm:items-end">
    <div class="col-span-2 flex flex-col gap-1.5">
      <label for="participants-user" class="text-sm font-semibold">{{
        $t('admin.contests.participants.userLabel')
      }}</label>
      <input
        id="participants-user"
        v-model="typedUser"
        :class="ADMIN_INPUT_CLASS"
        class="sm:w-52"
        :placeholder="$t('admin.contests.participants.userLabel')"
        autocomplete="off"
      />
    </div>
    <div class="flex flex-col gap-1.5">
      <label for="participants-kind" class="text-sm font-semibold">{{
        $t('admin.contests.participants.columns.kind')
      }}</label>
      <select id="participants-kind" v-model="kind" :class="ADMIN_INPUT_CLASS">
        <option v-for="value in KIND_FILTERS" :key="value" :value="value">
          {{ label('kind', value) }}
        </option>
      </select>
    </div>
    <div class="flex flex-col gap-1.5">
      <label for="participants-status" class="text-sm font-semibold">{{
        $t('admin.contests.participants.columns.status')
      }}</label>
      <select id="participants-status" v-model="status" :class="ADMIN_INPUT_CLASS">
        <option v-for="value in STATUS_FILTERS" :key="value" :value="value">
          {{ label('status', value) }}
        </option>
      </select>
    </div>
    <div class="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
      <label for="participants-sort" class="text-sm font-semibold">{{
        $t('admin.contestOps.participants.filters.sortLabel')
      }}</label>
      <select id="participants-sort" v-model="sort" :class="ADMIN_INPUT_CLASS">
        <option v-for="value in SORTS" :key="value" :value="value">
          {{ label('sort', value) }}
        </option>
      </select>
    </div>
  </div>
</template>
