<script setup lang="ts">
import { activityExportUrl } from '@/api/activity-admin.api';
import { useDebouncedText } from '@/lib/use-debounced-text';
import AdminField from '../ui/AdminField.vue';
import { ADMIN_BUTTON_CLASS, ADMIN_INPUT_CLASS } from '../ui/classes';
import { ACTIVITY_DAY_CHOICES, toActivityRequest } from './activity';
import type { ActivityDays, ActivityFilter } from './activity';

const props = defineProps<{ filter: ActivityFilter }>();
const emit = defineEmits<{ change: [filter: ActivityFilter] }>();

const DAY_LABEL_KEYS: Record<ActivityDays, string> = {
  7: 'admin.activity.filters.day7',
  30: 'admin.activity.filters.day30',
  90: 'admin.activity.filters.day90',
};

/** Each text box reports 300 ms after the last key, so a fast typist sends one request. */
const user = useDebouncedText(
  () => props.filter.user,
  (text) => emit('change', { ...props.filter, user: text }),
);
const ip = useDebouncedText(
  () => props.filter.ip,
  (text) => emit('change', { ...props.filter, ip: text }),
);
const path = useDebouncedText(
  () => props.filter.path,
  (text) => emit('change', { ...props.filter, path: text }),
);

const pickDays = (days: ActivityDays) => emit('change', { ...props.filter, days });
</script>

<template>
  <section class="flex flex-col gap-4" :aria-label="$t('admin.activity.title')">
    <div class="grid gap-3 sm:grid-cols-3">
      <AdminField v-slot="{ id, describedBy }" :label="$t('admin.activity.filters.user')">
        <input
          :id="id"
          v-model="user"
          type="text"
          maxlength="150"
          :aria-describedby="describedBy"
          :placeholder="$t('admin.activity.filters.userPlaceholder')"
          :class="ADMIN_INPUT_CLASS"
        />
      </AdminField>
      <AdminField v-slot="{ id, describedBy }" :label="$t('admin.activity.filters.ip')">
        <input
          :id="id"
          v-model="ip"
          type="text"
          maxlength="45"
          :aria-describedby="describedBy"
          :placeholder="$t('admin.activity.filters.ipPlaceholder')"
          :class="ADMIN_INPUT_CLASS"
        />
      </AdminField>
      <AdminField v-slot="{ id, describedBy }" :label="$t('admin.activity.filters.path')">
        <input
          :id="id"
          v-model="path"
          type="text"
          maxlength="200"
          :aria-describedby="describedBy"
          :placeholder="$t('admin.activity.filters.pathPlaceholder')"
          :class="ADMIN_INPUT_CLASS"
        />
      </AdminField>
    </div>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <fieldset class="flex flex-col gap-1.5">
        <legend class="text-sm font-semibold">{{ $t('admin.activity.filters.days') }}</legend>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="days in ACTIVITY_DAY_CHOICES"
            :key="days"
            class="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border border-line-strong px-4 has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:text-accent-soft-text"
          >
            <input
              type="radio"
              name="activity-days"
              :value="days"
              :checked="filter.days === days"
              class="size-4"
              @change="pickDays(days)"
            />
            {{ $t(DAY_LABEL_KEYS[days]) }}
          </label>
        </div>
      </fieldset>
      <a :href="activityExportUrl(toActivityRequest(filter))" download :class="ADMIN_BUTTON_CLASS">
        {{ $t('admin.activity.filters.export') }}
      </a>
    </div>
  </section>
</template>
