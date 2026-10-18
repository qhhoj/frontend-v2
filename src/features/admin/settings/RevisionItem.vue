<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { SettingRevision } from '@/api/types/settings-admin';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import { BUTTON } from '../ui/controls';
import { shortId } from '../ui/short-id';
import { diffLines, hasSealedPart } from './revisions';
import AdminChip from '../ui/AdminChip.vue';

const props = defineProps<{
  revision: SettingRevision;
  canRestore: boolean;
  restoreLabel: string;
  isWholeSecret: boolean;
}>();
const emit = defineEmits<{ restore: [revision: SettingRevision] }>();
const { t } = useI18n();
const locale = useLocaleStore();

const lines = computed(() => diffLines(props.revision));
const hasSealedSide = computed(() =>
  [props.revision.before, props.revision.after].some(hasSealedPart),
);
/** A scalar key's only field is its value: its line reads as the value alone. */
const lineText = (field: string, text: string) => (field === 'value' ? text : `${field}: ${text}`);
</script>

<template>
  <article data-testid="revision" class="flex flex-col gap-2 rounded-row border border-line p-3">
    <header class="flex flex-wrap items-center gap-2 text-sm text-muted">
      <time :datetime="revision.createdAt">{{
        formatDate(revision.createdAt, 'datetime', locale.locale)
      }}</time>
      <span>· {{ revision.actor ? shortId(revision.actor) : '—' }}</span>
      <AdminChip v-for="field in revision.changedFields" :key="field" class="font-mono">
        {{ field }}
      </AdminChip>
    </header>
    <div class="flex flex-col gap-1 font-mono text-sm">
      <p v-for="line in lines" :key="line.field" class="m-0">
        <span aria-hidden="true" class="text-negative">−</span>
        {{ lineText(line.field, line.before) }}
      </p>
      <p v-for="line in lines" :key="`${line.field}-after`" class="m-0">
        <span aria-hidden="true" class="text-positive">+</span>
        {{ lineText(line.field, line.after) }}
      </p>
    </div>
    <p v-if="hasSealedSide" class="text-xs text-muted">
      {{ t('admin.settings.revisions.secretNote') }}
    </p>
    <button
      v-if="canRestore"
      type="button"
      class="self-start"
      :class="BUTTON.secondary"
      @click="emit('restore', revision)"
    >
      {{ restoreLabel }}
    </button>
    <p v-else-if="isWholeSecret" class="text-xs text-muted">
      {{ t('admin.settings.revisions.notRestorable') }}
    </p>
  </article>
</template>
