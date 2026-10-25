<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { viewerTimeZone } from '@/lib/format-date';
import { useDebouncedText } from '@/lib/use-debounced-text';
import AdminField from '../ui/AdminField.vue';
import { BUTTON, INPUT } from '../ui/controls';
import AdminDateTimeField from '../ui/form/AdminDateTimeField.vue';
import { AUDIT_TYPES, dayOfInstant, dayStartInstant } from './audit';
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
/** The day range is read in the viewer's calendar (`toAuditRequest`), so the date boxes show that zone. */
const zone = viewerTimeZone();
const isRangeInverted = computed(
  () => props.filter.from !== '' && props.filter.to !== '' && props.filter.from > props.filter.to,
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
    <AdminDateTimeField
      :model-value="dayStartInstant(filter.from, zone)"
      :label="$t('admin.audit.filters.from')"
      :time-zone="zone"
      hint=""
      date-only
      @update:model-value="change({ from: dayOfInstant($event, zone) })"
    />
    <AdminDateTimeField
      :model-value="dayStartInstant(filter.to, zone)"
      :label="$t('admin.audit.filters.to')"
      :time-zone="zone"
      :error="isRangeInverted ? $t('admin.audit.filters.rangeInverted') : undefined"
      hint=""
      date-only
      @update:model-value="change({ to: dayOfInstant($event, zone) })"
    />
    <button
      v-if="isFiltered"
      type="button"
      :class="BUTTON.secondary"
      class="col-span-2 self-end justify-self-start lg:col-span-1"
      @click="clear"
    >
      {{ $t('common.clearFilters') }}
    </button>
  </section>
</template>
