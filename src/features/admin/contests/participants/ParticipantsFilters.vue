<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { translate } from '@/i18n';
import AdminField from '../../ui/AdminField.vue';
import { INPUT } from '../../ui/controls';
import { KIND_FILTERS, SORTS, STATUS_FILTERS, participationQueryWith } from './participant-filters';

/** The "Bộ lọc" panel of the participations list: kind, status and order, written to the URL as they change. */
const route = useRoute();
const router = useRouter();
const selectOf = (name: string) =>
  computed({
    get: () => String(route.query[name] ?? ''),
    set: (value: string) =>
      void router.replace({ query: participationQueryWith(route.query, { [name]: value }) }),
  });
const kind = selectOf('kind');
const status = selectOf('status');
const sort = selectOf('sort');
const label = (group: string, value: string) =>
  translate(`admin.contestOps.participants.filters.${group}.${value || 'all'}`);
</script>

<template>
  <div class="contents">
    <AdminField
      input-id="participants-kind"
      :label="$t('admin.contests.participants.columns.kind')"
    >
      <template #default="{ id }">
        <select :id="id" v-model="kind" :class="INPUT">
          <option v-for="value in KIND_FILTERS" :key="value" :value="value">
            {{ label('kind', value) }}
          </option>
        </select>
      </template>
    </AdminField>
    <AdminField
      input-id="participants-status"
      :label="$t('admin.contests.participants.columns.status')"
    >
      <template #default="{ id }">
        <select :id="id" v-model="status" :class="INPUT">
          <option v-for="value in STATUS_FILTERS" :key="value" :value="value">
            {{ label('status', value) }}
          </option>
        </select>
      </template>
    </AdminField>
    <AdminField
      input-id="participants-sort"
      :label="$t('admin.contestOps.participants.filters.sortLabel')"
    >
      <template #default="{ id }">
        <select :id="id" v-model="sort" :class="INPUT">
          <option v-for="value in SORTS" :key="value" :value="value">
            {{ label('sort', value) }}
          </option>
        </select>
      </template>
    </AdminField>
  </div>
</template>
