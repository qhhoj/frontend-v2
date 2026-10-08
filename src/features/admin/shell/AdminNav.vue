<script setup lang="ts">
import { computed, useId } from 'vue';
import { useRoute } from 'vue-router';
import { useSessionStore } from '@/stores/session.store';
import { ADMIN_NAV, isCurrentNav, visibleNav } from './admin-nav';

const route = useRoute();
const session = useSessionStore();
const groups = computed(() => visibleNav(ADMIN_NAV, session.user));
/** The shell renders two copies of this nav (side column and phone disclosure): ids are per instance, never repeated in the DOM. */
const idPrefix = useId();
</script>

<template>
  <nav data-testid="admin-nav" :aria-label="$t('admin.shell.navLabel')" class="flex flex-col gap-4">
    <section
      v-for="navGroup in groups"
      :key="navGroup.id"
      :aria-labelledby="`${idPrefix}-${navGroup.id}`"
    >
      <h2
        :id="`${idPrefix}-${navGroup.id}`"
        class="px-3 pb-1 text-xs font-bold tracking-wide text-muted uppercase"
      >
        {{ $t(navGroup.labelKey) }}
      </h2>
      <ul class="flex flex-col">
        <li v-for="item in navGroup.items" :key="item.id">
          <RouterLink
            :to="{ name: item.routeName }"
            :aria-current="isCurrentNav(item.path, route.path) ? 'page' : undefined"
            class="flex min-h-11 items-center gap-2.5 rounded-row px-3 text-sm font-medium hover:bg-surface-hover aria-[current=page]:bg-accent-soft aria-[current=page]:font-semibold aria-[current=page]:text-accent-soft-text"
          >
            <component :is="item.icon" aria-hidden="true" class="size-4 shrink-0" />{{
              $t(item.labelKey)
            }}
          </RouterLink>
        </li>
      </ul>
    </section>
    <p class="rounded-tile bg-surface-strong p-3 text-xs text-muted">
      {{ $t('admin.shell.navNote') }}
    </p>
  </nav>
</template>
