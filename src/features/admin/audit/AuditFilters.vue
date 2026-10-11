<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDebouncedText } from '@/lib/use-debounced-text';
import AdminField from '../ui/AdminField.vue';
import { BUTTON, INPUT } from '../ui/controls';
import { AUDIT_TYPES } from './audit';
import type { AuditFilter, AuditType } from './audit';

const props = defineProps<{ filter: AuditFilter }>();
const emit = defineEmits<{ change: [filter: AuditFilter] }>();
const { t } = useI18n();

const actor = useDebouncedText(
  () => props.filter.actor,
  (text) => emit('change', { ...props.filter, actor: text }),
);
const change = (patch: Partial<AuditFilter>) => emit('change', { ...props.filter, ...patch });
const typeOptions = computed(() =>
  AUDIT_TYPES.map((type) => ({ type, label: t(`admin.audit.types.${type}`) })),
);
const isFiltered = computed(() => Object.values(props.filter).some((value) => value !== ''));
/** One change; the actor box follows the URL back to empty, which also drops a pause still pending. */
function clear() {
  emit('change', { actor: '', type: '', from: '', to: '' });
}
</script>

<template>
  <section
    class="grid grid-cols-2 gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end"
    :aria-label="$t('admin.audit.filters.label')"
  >
    <AdminField
      v-slot="{ id }"
      class="col-span-2 sm:col-span-1"
      :label="$t('admin.audit.filters.actor')"
    >
      <input
        :id="id"
        v-model="actor"
        type="text"
        maxlength="150"
        autocomplete="off"
        :placeholder="$t('admin.audit.filters.actorPlaceholder')"
        :class="INPUT"
      />
    </AdminField>
    <AdminField
      v-slot="{ id }"
      class="col-span-2 sm:col-span-1"
      :label="$t('admin.audit.filters.type')"
    >
      <select
        :id="id"
        :value="filter.type"
        :class="INPUT"
        @change="change({ type: ($event.target as HTMLSelectElement).value as AuditType | '' })"
      >
        <option value="">{{ $t('admin.audit.filters.anyType') }}</option>
        <option v-for="option in typeOptions" :key="option.type" :value="option.type">
          {{ option.label }}
        </option>
      </select>
    </AdminField>
    <AdminField v-slot="{ id }" :label="$t('admin.audit.filters.from')">
      <input
        :id="id"
        type="date"
        :value="filter.from"
        :max="filter.to || undefined"
        :class="INPUT"
        @change="change({ from: ($event.target as HTMLInputElement).value })"
      />
    </AdminField>
    <AdminField v-slot="{ id }" :label="$t('admin.audit.filters.to')">
      <input
        :id="id"
        type="date"
        :value="filter.to"
        :min="filter.from || undefined"
        :class="INPUT"
        @change="change({ to: ($event.target as HTMLInputElement).value })"
      />
    </AdminField>
    <button
      v-if="isFiltered"
      type="button"
      :class="BUTTON.secondary"
      class="col-span-2 self-end justify-self-start lg:col-span-1"
      @click="clear"
    >
      {{ $t('admin.audit.filters.clear') }}
    </button>
  </section>
</template>
