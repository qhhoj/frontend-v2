<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

defineProps<{ crumbs: { label: string; to?: RouteLocationRaw }[]; title: string; lead?: string }>();
</script>

<template>
  <header class="flex flex-wrap items-end gap-4">
    <div class="min-w-0 flex-1">
      <nav
        :aria-label="$t('common.breadcrumb')"
        class="flex flex-wrap items-center gap-1.5 text-sm text-muted"
      >
        <template v-for="(crumb, index) in crumbs" :key="index">
          <span v-if="index > 0" aria-hidden="true">/</span>
          <RouterLink v-if="crumb.to" :to="crumb.to" class="hover:underline">{{
            crumb.label
          }}</RouterLink>
          <span v-else class="font-mono">{{ crumb.label }}</span>
        </template>
      </nav>
      <h1 class="page-title">{{ title }}</h1>
      <p v-if="lead" class="text-sm text-muted">{{ lead }}</p>
    </div>
    <div class="flex flex-wrap gap-2"><slot name="actions" /></div>
  </header>
</template>
