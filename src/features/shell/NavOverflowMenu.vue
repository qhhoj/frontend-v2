<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';
import { computed } from 'vue';
import Menu from '@/components/ui/Menu.vue';
import type { MenuEntry } from '@/components/ui/Menu.vue';
import { NAV_ITEM_CLASS } from './nav-overflow';

/**
 * The "More" button of the nav: a menu listing the items that do not fit in the bar. The trigger keeps the nav item's own
 * shape (`NAV_ITEM_CLASS`, which `AppNav` measures), so it is a plain button, not an `AppButton`.
 */
const props = defineProps<{ items: Array<{ path: string; label: string }> }>();
const model = computed<MenuEntry[]>(() =>
  props.items.map((item) => ({ label: item.label, to: item.path })),
);
</script>

<template>
  <Menu :items="model" :label="$t('nav.more')">
    <template #trigger="{ toggle, open, setOpener }">
      <button
        :ref="(el) => setOpener(el as HTMLElement | null)"
        type="button"
        data-testid="nav-more"
        :class="[NAV_ITEM_CLASS, 'gap-1 text-muted hover:text-content']"
        aria-haspopup="menu"
        :aria-expanded="open"
        @click="toggle"
      >
        {{ $t('nav.more') }}
        <ChevronDown aria-hidden="true" class="size-4" />
      </button>
    </template>
  </Menu>
</template>
