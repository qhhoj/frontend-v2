<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDebouncedText } from '@/lib/use-debounced-text';
import AdminField from '../ui/AdminField.vue';
import AdminFilterTabs from '../ui/AdminFilterTabs.vue';
import type { AdminFilterTab } from '../ui/AdminFilterTabs.vue';
import { INPUT } from '../ui/controls';
import AdminFilterBar from '../ui/table/AdminFilterBar.vue';
import type { ActiveFilter } from '../ui/table/AdminFilterBar.vue';
import { ACTIVITY_DAY_CHOICES } from './activity';
import type { ActivityDays, ActivityFilter } from './activity';

/** The log filter row: user search, the 7 / 30 / 90-day switch, and IP and path in the filter panel (shown as chips). */
const props = defineProps<{ filter: ActivityFilter }>();
const emit = defineEmits<{ change: [filter: ActivityFilter] }>();
const { t } = useI18n();

/** The backend's length cap on `user`. */
const USER_SEARCH_MAX_LENGTH = 150;
const change = (patch: Partial<ActivityFilter>) => emit('change', { ...props.filter, ...patch });
const user = computed({
  get: () => props.filter.user,
  set: (text: string) => change({ user: text.trim().slice(0, USER_SEARCH_MAX_LENGTH) }),
});
/** The panel's boxes report 300 ms after the last key, so a fast typist sends one request. */
const ip = useDebouncedText(
  () => props.filter.ip,
  (text) => change({ ip: text }),
);
const path = useDebouncedText(
  () => props.filter.path,
  (text) => change({ path: text }),
);

const dayTabs = computed<AdminFilterTab[]>(() =>
  ACTIVITY_DAY_CHOICES.map((days) => ({
    key: String(days),
    label: t('admin.activity.filters.dayCount', { days }),
  })),
);
const pickDays = (key: string) => change({ days: Number(key) as ActivityDays });

type PanelField = 'ip' | 'path';
const chips = computed<ActiveFilter[]>(() =>
  (['ip', 'path'] as const)
    .filter((field) => props.filter[field] !== '')
    .map((field) => ({
      key: field,
      label: `${t(`admin.activity.filters.${field}`)}: ${props.filter[field]}`,
    })),
);
const removeChip = (key: string) => change({ [key as PanelField]: '' });
const clearAll = () => change({ ip: '', path: '' });
</script>

<template>
  <AdminFilterBar
    v-model:search="user"
    :search-label="$t('admin.activity.filters.userSearch')"
    :chips="chips"
    :filter-count="chips.length"
    @remove="removeChip"
    @clear-all="clearAll"
  >
    <template #view>
      <AdminFilterTabs
        :tabs="dayTabs"
        :current="String(filter.days)"
        :label="$t('admin.activity.filters.days')"
        @update:current="pickDays"
      />
    </template>
    <template #filters>
      <AdminField v-slot="{ id, describedBy }" :label="$t('admin.activity.filters.ip')">
        <input
          :id="id"
          v-model="ip"
          type="text"
          maxlength="45"
          :aria-describedby="describedBy"
          :placeholder="$t('admin.activity.filters.ipPlaceholder')"
          :class="[INPUT, 'font-mono']"
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
          :class="[INPUT, 'font-mono']"
        />
      </AdminField>
    </template>
  </AdminFilterBar>
</template>
