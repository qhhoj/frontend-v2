<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import UserContent from '@/components/UserContent.vue';

/** The about text cut to about six lines; "Xem thêm" shows the rest, and only appears when the text is longer. */
const props = defineProps<{ html: string }>();
const COLLAPSED_PX = 144;
const box = ref<HTMLElement | null>(null);
const isLong = ref(false);
const isOpen = ref(false);
const measure = () => {
  if (box.value) isLong.value = box.value.scrollHeight > COLLAPSED_PX + 8;
};
onMounted(measure);
watch(
  () => props.html,
  () => void nextTick(measure),
);
</script>

<template>
  <div class="flex flex-col items-start gap-1">
    <div ref="box" class="w-full min-w-0 overflow-hidden" :class="!isOpen && 'max-h-36'">
      <UserContent :html="html" />
    </div>
    <AppButton v-if="isLong" tone="link" :aria-expanded="isOpen" @click="isOpen = !isOpen">
      {{ $t(isOpen ? 'orgs.showLess' : 'orgs.showMore') }}
    </AppButton>
  </div>
</template>
