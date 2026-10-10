<script setup lang="ts">
import Menu from 'primevue/menu';
import type { MenuItem } from 'primevue/menuitem';
import { ChevronDown } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { NAV_ITEM_CLASS } from './nav-overflow';

/** The "More" button of the nav: a menu button listing the items that do not fit in the bar. */
const props = defineProps<{ items: Array<{ path: string; label: string }> }>();
const router = useRouter();
const menu = ref<InstanceType<typeof Menu>>();
const isOpen = ref(false);
const model = computed<MenuItem[]>(() =>
  props.items.map((item) => ({ label: item.label, command: () => void router.push(item.path) })),
);
</script>

<template>
  <button
    type="button"
    data-testid="nav-more"
    :class="[NAV_ITEM_CLASS, 'gap-1 text-muted hover:text-content']"
    aria-haspopup="menu"
    :aria-expanded="isOpen"
    @click="menu?.toggle($event)"
  >
    {{ $t('nav.more') }}
    <ChevronDown aria-hidden="true" class="size-4" />
  </button>
  <Menu
    ref="menu"
    :model="model"
    popup
    :pt="{ root: { 'aria-label': $t('nav.more') } }"
    @show="isOpen = true"
    @hide="isOpen = false"
  />
</template>
