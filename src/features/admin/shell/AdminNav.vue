<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';
import { computed, useId } from 'vue';
import { useRoute } from 'vue-router';
import { useSessionStore } from '@/stores/session.store';
import { ADMIN_NAV, isCurrentNav, visibleNav } from './admin-nav';
import { useNavCounts } from './overview/admin-overview.queries';
import { useNavCollapse } from './use-nav-collapse';

const route = useRoute();
const session = useSessionStore();
const groups = computed(() => visibleNav(ADMIN_NAV, session.user));
const counts = useNavCounts();
const { isOpen, toggle } = useNavCollapse();
/** The shell renders two copies of this nav (side column and phone disclosure): ids are per instance, never repeated in the DOM. */
const idPrefix = useId();
</script>

<template>
  <nav data-testid="admin-nav" :aria-label="$t('admin.shell.navLabel')" class="flex flex-col gap-3">
    <section
      v-for="navGroup in groups"
      :key="navGroup.id"
      :aria-labelledby="`${idPrefix}-${navGroup.id}`"
    >
      <h2>
        <button
          :id="`${idPrefix}-${navGroup.id}`"
          type="button"
          :aria-expanded="isOpen(navGroup.id)"
          :aria-controls="`${idPrefix}-${navGroup.id}-items`"
          class="flex min-h-9 w-full items-center justify-between rounded-row px-3 text-xs font-bold tracking-wide text-muted uppercase hover:bg-surface-hover"
          @click="toggle(navGroup.id)"
        >
          {{ $t(navGroup.labelKey) }}
          <ChevronDown
            aria-hidden="true"
            class="size-3.5 transition-transform motion-reduce:transition-none"
            :class="isOpen(navGroup.id) ? '' : '-rotate-90'"
          />
        </button>
      </h2>
      <ul
        v-show="isOpen(navGroup.id)"
        :id="`${idPrefix}-${navGroup.id}-items`"
        class="flex flex-col"
      >
        <li v-for="item in navGroup.items" :key="item.id">
          <RouterLink
            :to="{ name: item.routeName }"
            :aria-current="isCurrentNav(item.path, route.path) ? 'page' : undefined"
            class="flex min-h-11 items-center gap-2.5 rounded-row px-3 text-sm font-medium hover:bg-surface-hover aria-[current=page]:bg-accent-soft aria-[current=page]:font-semibold aria-[current=page]:text-accent-soft-text"
          >
            <component :is="item.icon" aria-hidden="true" class="size-4 shrink-0" />
            <span class="min-w-0 flex-1">{{ $t(item.labelKey) }}</span>
            <span
              v-if="counts[item.id]"
              data-testid="admin-nav-count"
              class="rounded-pill bg-content px-2 py-0.5 text-xs font-semibold text-ground tabular-nums"
            >
              {{ counts[item.id] }}
              <span class="sr-only">{{ $t('admin.shell.waiting') }}</span>
            </span>
          </RouterLink>
        </li>
      </ul>
    </section>
    <p class="rounded-tile bg-surface-strong p-3 text-xs text-muted">
      {{ $t('admin.shell.navNote') }}
    </p>
  </nav>
</template>
