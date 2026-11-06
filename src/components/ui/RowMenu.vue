<!-- eslint-disable vue/multi-word-component-names -- the kit names primitives by role (docs/design-language.md). -->
<script setup lang="ts">
import { Ellipsis } from 'lucide-vue-next';
import IconButton from './IconButton.vue';
import Menu from './Menu.vue';
import type { MenuEntry } from './Menu.vue';

export type RowMenuItem = MenuEntry;

/**
 * The "⋯" menu of a row or a header: secondary actions, destructive ones last and separated. `label` names the trigger
 * and the list (the standard word is "Thêm thao tác", `common.moreActions`). Admin lists build the items with
 * `standardRowMenu` (admin/ui/table/standard-row-menu.ts), which keeps the order and the words the same on every list.
 */
defineProps<{ items: MenuEntry[]; label: string }>();
</script>

<template>
  <Menu :items="items" :label="label">
    <template #trigger="{ toggle, open, setOpener }">
      <IconButton
        :ref="(el) => setOpener((el as { $el?: HTMLElement } | null)?.$el ?? null)"
        :label="label"
        size="sm"
        aria-haspopup="menu"
        :aria-expanded="open"
        @click="toggle"
      >
        <Ellipsis aria-hidden="true" />
      </IconButton>
    </template>
  </Menu>
</template>
