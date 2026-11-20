<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue';
import PageLayout from '@/components/ui/PageLayout.vue';
import ModeChoice from '@/features/appearance/ModeChoice.vue';
import KitComponents from './KitComponents.vue';
import KitControls from './KitControls.vue';
import KitFoundations from './KitFoundations.vue';

/**
 * `/dev/kit` (admin only): every kit part and token with its variants, for agents and the owner to look at before UI work.
 * Fixtures are inline, so it needs no backend. The mode switch is the site's own; DESIGN.md is the written rulebook.
 */
defineOptions({ name: 'KitGalleryPage' });
</script>

<template>
  <PageLayout>
    <template #header>
      <PageHeader title="Bộ thành phần" lead="Nền tảng, tín hiệu màu và từng thành phần của bộ UI.">
        <template #actions><ModeChoice /></template>
      </PageHeader>
    </template>
    <div class="flex flex-col gap-(--space-section)">
      <KitControls />
      <section aria-labelledby="kit-foundations" class="flex flex-col gap-(--space-section)">
        <h2 id="kit-foundations" class="sr-only">Nền tảng</h2>
        <KitFoundations />
      </section>
      <section aria-labelledby="kit-components" class="flex flex-col gap-(--space-section)">
        <h2 id="kit-components" class="sr-only">Thành phần</h2>
        <KitComponents />
      </section>
    </div>
  </PageLayout>
</template>
