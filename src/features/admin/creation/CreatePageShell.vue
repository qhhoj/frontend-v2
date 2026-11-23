<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import PageHeader from '@/components/ui/PageHeader.vue';
import Card from '@/components/ui/Card.vue';
import { useInjectedSection } from '@/components/ui/page-section';

/**
 * The frame every "create" page shares (problem, contest): the page header with its way back, then one narrow card that
 * holds the form. The way back leads to the list of the page's own site section ("Bài tập của tôi", "Kỳ thi của tôi"), the
 * name the rail uses, so no page names it. The form owns its buttons; the page has no second header and no save bar.
 */
defineProps<{
  title: string;
  lead: string;
}>();
const { t } = useI18n();
const section = useInjectedSection();
const back = computed(() =>
  section.value ? { to: section.value.path, label: t(section.value.labelKey) } : null,
);
</script>

<template>
  <div class="flex flex-col gap-4">
    <PageHeader :title="title" :lead="lead" :back="back" />
    <Card padding="md" class="max-w-xl"><slot /></Card>
  </div>
</template>
