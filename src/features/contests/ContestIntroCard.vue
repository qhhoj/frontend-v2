<script setup lang="ts">
import { ref } from 'vue';
import type { ContestDetail } from '@/api/types/contests';
import Disclosure from '@/components/ui/Disclosure.vue';
import UserContent from '@/components/UserContent.vue';

/**
 * The contest's description, folded to its title while the problems are listed: it is read once and often holds a large
 * image, which must not push the problems down. Before the statements show it is the page's content, so it starts open.
 */
const props = defineProps<{ contest: ContestDetail }>();
const isOpen = ref(props.contest.problems === null);
</script>

<template>
  <div v-if="contest.descriptionHtml" data-testid="contest-intro" class="border-b border-line">
    <Disclosure v-model:open="isOpen" :label="$t('contests.rules.intro')">
      <div class="pb-4"><UserContent :html="contest.descriptionHtml" /></div>
    </Disclosure>
  </div>
</template>
