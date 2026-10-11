<script setup lang="ts">
import { computed } from 'vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { ADMIN_BUTTON_CLASS, ADMIN_DANGER_CLASS } from '../ui/classes';

/**
 * The changelist's action bar: what is selected, "select every match", and the two batch actions. `canTakeAll` is off when the
 * list filters on something a batch cannot (the judging state), so "every match" would reach more rows than the list shows.
 */
const props = defineProps<{
  selectedCount: number;
  total: number;
  pageCount: number;
  canTakeAll: boolean;
}>();
const allMatching = defineModel<boolean>('allMatching', { required: true });
defineEmits<{ rejudge: []; rescore: []; clear: [] }>();
const locale = useLocaleStore();
const count = computed(() =>
  formatNumber(allMatching.value ? props.total : props.selectedCount, locale.locale),
);
/** Offered once the whole page is ticked and more rows match than the page shows (the admin's "select all N"). */
const canSelectAll = computed(
  () =>
    props.canTakeAll &&
    !allMatching.value &&
    props.selectedCount >= props.pageCount &&
    props.total > props.pageCount,
);
</script>

<template>
  <section
    v-if="selectedCount > 0 || allMatching"
    class="glass sticky top-2 z-10 flex flex-wrap items-center gap-3 rounded-panel p-4"
    :aria-label="$t('admin.submissions.bulk.label')"
  >
    <p class="text-sm font-semibold" role="status">
      {{
        allMatching
          ? $t('admin.submissions.bulk.allSelected', { count })
          : $t('admin.submissions.bulk.selected', { count })
      }}
    </p>
    <button
      v-if="canSelectAll"
      type="button"
      class="text-sm font-semibold text-accent-text underline"
      @click="allMatching = true"
    >
      {{ $t('admin.submissions.bulk.selectAll', { total: formatNumber(total, locale.locale) }) }}
    </button>
    <button type="button" class="text-sm text-muted underline" @click="$emit('clear')">
      {{ $t('admin.submissions.bulk.clear') }}
    </button>
    <div class="ml-auto flex flex-wrap gap-2">
      <button type="button" :class="ADMIN_BUTTON_CLASS" @click="$emit('rescore')">
        {{ $t('admin.rejudge.filter.rescore') }}
      </button>
      <button type="button" :class="ADMIN_DANGER_CLASS" @click="$emit('rejudge')">
        {{ $t('admin.submissions.bulk.rejudge') }}
      </button>
    </div>
  </section>
</template>
