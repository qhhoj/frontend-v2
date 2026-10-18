<script setup lang="ts">
import { ChevronDown, ChevronRight } from 'lucide-vue-next';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatDate } from '@/lib/format-date';
import type { FlatpageRevision } from '@/api/types/flatpages-admin';
import { useLocaleStore } from '@/stores/locale.store';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { BUTTON } from '../ui/controls';
import ChangeLines from './ChangeLines.vue';
import { canLoadOldValues, changeLinesOf, fieldLabelKey } from './flatpage-history';
import AdminChip from '../ui/AdminChip.vue';

const props = defineProps<{ revision: FlatpageRevision; isOpen: boolean; readonly?: boolean }>();
const emit = defineEmits<{ toggle: []; load: [] }>();
const { t } = useI18n();
const localeStore = useLocaleStore();
const ACTION_TONES = { create: 'positive', edit: 'accent', delete: 'negative' } as const;
const fields = computed(() => Object.keys(props.revision.changes));
const lines = computed(() => changeLinesOf(props.revision.changes));
</script>

<template>
  <tbody data-testid="revision" class="contents">
    <tr class="border-t border-line align-top">
      <td class="px-3 py-2 font-mono text-xs whitespace-nowrap">
        {{ formatDate(revision.at, 'datetime', localeStore.locale) }}
      </td>
      <td class="px-3 py-2">
        <AdminChip :tone="ACTION_TONES[revision.action]">{{
          t(`admin.pages.history.actions.${revision.action}`)
        }}</AdminChip>
      </td>
      <td class="px-3 py-2">
        <AdminUserLabel
          v-if="revision.editor"
          :username="revision.editor.username"
          :rating="revision.editor.rating"
        />
        <span v-else class="text-muted">{{ t('admin.pages.history.deletedEditor') }}</span>
      </td>
      <td class="px-3 py-2">
        <ul class="flex flex-wrap gap-1">
          <li v-for="field in fields" :key="field">
            <AdminChip>{{ t(fieldLabelKey(field)) }}</AdminChip>
          </li>
        </ul>
      </td>
      <td class="px-3 py-2">
        <div class="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            class="min-h-11 rounded-pill border border-line px-3 text-sm font-semibold hover:bg-surface-hover"
            :aria-expanded="isOpen"
            :aria-label="t('admin.pages.history.showChanges')"
            @click="emit('toggle')"
          >
            <component
              :is="isOpen ? ChevronDown : ChevronRight"
              aria-hidden="true"
              class="size-4"
            />
          </button>
          <button
            v-if="!readonly && canLoadOldValues(revision)"
            type="button"
            :class="BUTTON.secondary"
            @click="emit('load')"
          >
            {{ t('admin.pages.history.load') }}
          </button>
        </div>
      </td>
    </tr>
    <tr v-if="isOpen">
      <td colspan="5" class="px-3 pb-4"><ChangeLines :lines="lines" /></td>
    </tr>
  </tbody>
</template>
