<script setup lang="ts">
import { ChevronDown, FileArchive, Upload, Workflow } from 'lucide-vue-next';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Menu from '@/components/ui/Menu.vue';
import type { MenuEntry } from '@/components/ui/Menu.vue';
import { buttonClass } from '../ui/controls';

/** The problems header's "Nhập ▾": Polygon and .zip import behind one secondary button. */
const { t } = useI18n();
const items = computed<MenuEntry[]>(() => [
  {
    label: t('admin.shell.dashboard.actions.polygonImport'),
    icon: Workflow,
    to: { name: 'admin-polygonImport' },
  },
  {
    label: t('admin.shell.dashboard.actions.problemImport'),
    icon: FileArchive,
    to: { name: 'admin-problemImport' },
  },
]);
</script>

<template>
  <Menu :items="items" :label="$t('admin.problemList.import.label')">
    <template #trigger="{ toggle, open, setOpener }">
      <button
        :ref="(el) => setOpener(el as HTMLElement | null)"
        type="button"
        :class="buttonClass('secondary')"
        aria-haspopup="menu"
        :aria-expanded="open"
        @click="toggle"
      >
        <Upload aria-hidden="true" class="size-4" :stroke-width="1.75" />
        {{ $t('admin.problemList.import.button') }}
        <ChevronDown aria-hidden="true" class="size-4" :stroke-width="1.75" />
      </button>
    </template>
  </Menu>
</template>
