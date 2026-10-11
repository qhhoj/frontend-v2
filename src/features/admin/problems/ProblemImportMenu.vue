<script setup lang="ts">
import { ChevronDown, FileArchive, Upload, Workflow } from 'lucide-vue-next';
import Menu from 'primevue/menu';
import type { MenuItem } from 'primevue/menuitem';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { buttonClass } from '../ui/controls';

/** The problems header's "Nhập ▾": Polygon and .zip import behind one secondary button. */
const { t } = useI18n();
const router = useRouter();
const menu = ref<InstanceType<typeof Menu>>();
const isOpen = ref(false);
const items = computed<MenuItem[]>(() => [
  {
    label: t('admin.shell.dashboard.actions.polygonImport'),
    rowIcon: Workflow,
    command: () => void router.push({ name: 'admin-polygonImport' }),
  },
  {
    label: t('admin.shell.dashboard.actions.problemImport'),
    rowIcon: FileArchive,
    command: () => void router.push({ name: 'admin-problemImport' }),
  },
]);
</script>

<template>
  <button
    type="button"
    :class="buttonClass('secondary')"
    aria-haspopup="menu"
    :aria-expanded="isOpen"
    @click="menu?.toggle($event)"
  >
    <Upload aria-hidden="true" class="size-4" :stroke-width="1.75" />
    {{ $t('admin.problemList.import.button') }}
    <ChevronDown aria-hidden="true" class="size-4" :stroke-width="1.75" />
  </button>
  <Menu
    ref="menu"
    :model="items"
    popup
    :pt="{ root: { 'aria-label': $t('admin.problemList.import.label') } }"
    @show="isOpen = true"
    @hide="isOpen = false"
  >
    <template #item="{ item, props: itemProps }">
      <a
        v-bind="itemProps.action"
        class="flex min-h-10 cursor-pointer items-center gap-3 px-3 text-sm text-content no-underline pointer-coarse:min-h-11"
      >
        <component
          :is="item.rowIcon"
          aria-hidden="true"
          class="size-4 shrink-0 text-muted"
          :stroke-width="1.75"
        />
        <span>{{ item.label }}</span>
      </a>
    </template>
  </Menu>
</template>
