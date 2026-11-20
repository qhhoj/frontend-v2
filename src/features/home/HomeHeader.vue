<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue';
import { greetingKey } from '@/lib/format';
import { formatWeekdayDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';

/**
 * The signed-in page header: today's date over the greeting, which is the H1. The viewer's numbers are not here: the
 * solved count is in "Làm tiếp", the rating and the global rank are on the profile (the home shows no global ranking).
 */
defineProps<{ username: string }>();
const locale = useLocaleStore();
const today = new Date();
const greeting = greetingKey(today.getHours());
</script>

<template>
  <PageHeader :title="$t(greeting, { username })" data-testid="home-header">
    <template #above>
      <span class="eyebrow">{{ formatWeekdayDate(today.toISOString(), locale.locale) }}</span>
    </template>
  </PageHeader>
</template>
