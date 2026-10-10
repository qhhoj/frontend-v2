<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import UserContent from '@/components/UserContent.vue';
import { useCopyableBlocks } from './use-copyable-blocks';

const props = defineProps<{ html: string }>();
const box = ref<{ $el: HTMLElement } | null>(null);
useCopyableBlocks(
  computed(() => box.value?.$el ?? null),
  toRef(props, 'html'),
);
</script>

<template>
  <UserContent ref="box" class="statement" :html="html" />
</template>
