<script setup lang="ts">
import { ChevronDown, LayoutDashboard } from 'lucide-vue-next';
import { computed, useId } from 'vue';
import { useRoute } from 'vue-router';
import { useSessionStore } from '@/stores/session.store';
import { ADMIN_NAV, isCurrentItem, visibleNav } from './admin-nav';
import type { AdminNavGroup, AdminNavId, AdminNavItem } from './admin-nav';
import { useNavCollapse } from './use-nav-collapse';
import type { NavCount } from './overview/admin-overview.queries';

/** Badge counts by item; the shell reads them once for both copies of the nav. */
defineProps<{ counts: Partial<Record<AdminNavId, NavCount>> }>();

const route = useRoute();
const session = useSessionStore();
const groups = computed(() => visibleNav(ADMIN_NAV, session.user));
const { isOpen, toggle } = useNavCollapse();
/** The shell renders two copies of this nav (side column and phone sheet): ids are per instance, never repeated in the DOM. */
const idPrefix = useId();

const isCurrent = (item: AdminNavItem) => isCurrentItem(item, route.path);
/** The group holding the current screen never folds, so the nav always shows where the viewer is. */
const holdsCurrent = (navGroup: AdminNavGroup) => navGroup.items.some((item) => isCurrent(item));

const ITEM_CLASS =
  'flex min-h-(--qa-control) items-center gap-2.5 rounded-cell px-2.5 text-sm hover:bg-surface-hover aria-[current=page]:bg-accent-soft aria-[current=page]:font-semibold aria-[current=page]:text-accent-soft-text';
const GROUP_CLASS =
  'flex min-h-8 w-full items-center justify-between rounded-cell px-2.5 text-xs font-semibold tracking-wider text-muted uppercase touch:min-h-11';
</script>

<template>
  <nav data-testid="admin-nav" :aria-label="$t('admin.shell.navLabel')" class="flex flex-col gap-2">
    <RouterLink
      :to="{ name: 'admin-dashboard' }"
      :aria-current="route.name === 'admin-dashboard' ? 'page' : undefined"
      :class="ITEM_CLASS"
    >
      <LayoutDashboard aria-hidden="true" class="size-4 shrink-0" />
      {{ $t('admin.shell.overviewLink') }}
    </RouterLink>
    <section
      v-for="navGroup in groups"
      :key="navGroup.id"
      :aria-labelledby="`${idPrefix}-${navGroup.id}`"
    >
      <p v-if="holdsCurrent(navGroup)" :id="`${idPrefix}-${navGroup.id}`" :class="GROUP_CLASS">
        {{ $t(navGroup.labelKey) }}
      </p>
      <div v-else>
        <button
          :id="`${idPrefix}-${navGroup.id}`"
          type="button"
          :aria-expanded="isOpen(navGroup.id)"
          :aria-controls="`${idPrefix}-${navGroup.id}-items`"
          :class="GROUP_CLASS"
          class="hover:bg-surface-hover hover:text-content"
          @click="toggle(navGroup.id)"
        >
          {{ $t(navGroup.labelKey) }}
          <ChevronDown
            aria-hidden="true"
            class="size-3.5 transition-transform motion-reduce:transition-none"
            :class="isOpen(navGroup.id) ? '' : '-rotate-90'"
          />
        </button>
      </div>
      <ul
        v-show="holdsCurrent(navGroup) || isOpen(navGroup.id)"
        :id="`${idPrefix}-${navGroup.id}-items`"
        class="flex flex-col gap-px"
      >
        <li v-for="item in navGroup.items" :key="item.id">
          <RouterLink
            :to="{ name: item.routeName }"
            :aria-current="isCurrent(item) ? 'page' : undefined"
            :class="ITEM_CLASS"
          >
            <component :is="item.icon" aria-hidden="true" class="size-4 shrink-0" />
            <span class="min-w-0 flex-1">{{ $t(item.labelKey) }}</span>
            <span
              v-if="counts[item.id]?.value"
              data-testid="admin-nav-count"
              class="rounded-pill px-2 py-0.5 font-mono text-xs font-semibold tabular-nums"
              :class="
                counts[item.id]?.needsAction
                  ? 'bg-verdict-tle-bg text-verdict-tle'
                  : 'bg-surface-strong text-muted'
              "
            >
              {{ counts[item.id]?.value }}
              <span class="sr-only">{{
                counts[item.id]?.needsAction ? $t('admin.shell.waiting') : $t('admin.shell.queued')
              }}</span>
            </span>
          </RouterLink>
        </li>
      </ul>
    </section>
  </nav>
</template>
