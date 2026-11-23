<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import Card from '@/components/ui/Card.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';

/**
 * The frame every "create" page shares (problem, contest): the page header with its way back, then one narrow card that
 * holds the form. The form owns its buttons; the page has no second header and no save bar.
 */
defineProps<{
  title: string;
  lead: string;
  back?: { to: RouteLocationRaw; label: string };
}>();
</script>

<template>
  <div class="flex flex-col gap-4">
    <AdminPageHeader :title="title" :lead="lead" :back="back" />
    <Card padding="md" class="max-w-xl"><slot /></Card>
  </div>
</template>
