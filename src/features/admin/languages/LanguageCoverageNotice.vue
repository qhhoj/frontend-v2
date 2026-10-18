<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Notice from '@/components/ui/Notice.vue';
import type { LanguageRow } from './languages';

/**
 * One standing notice for the languages the judges cover badly: those no usable judge runs (their submissions wait, the real
 * outage: danger) and those only one judge runs (a single point of failure: warning). Each kind is one line listing the keys.
 */
const props = defineProps<{ unserved: LanguageRow[]; singles: LanguageRow[] }>();
const { t } = useI18n();
/** A language only one judge runs, and that judge is offline, is on the unserved line only. */
const lone = computed(() => props.singles.filter((row) => !props.unserved.includes(row)));
const count = computed(() => props.unserved.length + lone.value.length);
const keysOf = (rows: LanguageRow[]) => rows.map((row) => row.key).join(', ');
</script>

<template>
  <Notice
    v-if="count > 0"
    compact
    :role="null"
    :tone="unserved.length > 0 ? 'danger' : 'warning'"
    :title="t('admin.languages.attention.title', { count }, count)"
  >
    <ul class="m-0 flex list-none flex-col gap-1 p-0">
      <li v-if="unserved.length > 0">
        <i18n-t keypath="admin.languages.attention.unserved" tag="span">
          <template #keys>
            <strong class="font-mono">{{ keysOf(unserved) }}</strong>
          </template>
        </i18n-t>
      </li>
      <li v-if="lone.length > 0">
        <i18n-t keypath="admin.languages.attention.single" tag="span">
          <template #keys>
            <strong class="font-mono">{{ keysOf(lone) }}</strong>
          </template>
        </i18n-t>
      </li>
    </ul>
  </Notice>
</template>
