<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { navCrumbsOf } from '../shell/admin-nav';
import type { AdminCrumb } from '../shell/admin-nav';

/** The nav group and parent screen lead the crumbs on every page; `trail` adds what only this page knows (a code, a key). */
const props = defineProps<{ title: string; lead?: string; trail?: AdminCrumb[] }>();
const route = useRoute();
const { t } = useI18n();
const crumbs = computed(() => [...navCrumbsOf(route.path, t), ...(props.trail ?? [])]);
</script>

<template>
  <header class="flex flex-wrap items-end gap-4">
    <div class="min-w-[min(100%,16rem)] flex-1">
      <nav
        v-if="crumbs.length > 0"
        :aria-label="$t('common.breadcrumb')"
        class="flex flex-wrap items-center gap-1.5 text-sm text-muted"
      >
        <template v-for="(crumb, index) in crumbs" :key="index">
          <span v-if="index > 0" aria-hidden="true">/</span>
          <RouterLink
            v-if="crumb.to"
            :to="crumb.to"
            class="hover:underline"
            :class="{ 'font-mono': crumb.mono }"
            >{{ crumb.label }}</RouterLink
          >
          <span v-else :class="{ 'font-mono': crumb.mono }">{{ crumb.label }}</span>
        </template>
      </nav>
      <h1 class="page-title">{{ title }}</h1>
      <p v-if="lead" class="text-sm text-muted">{{ lead }}</p>
    </div>
    <div class="flex flex-wrap items-center gap-2"><slot name="actions" /></div>
  </header>
</template>
