<script setup lang="ts">
import { computed } from 'vue';
import { hasPermission } from '@/lib/permissions';
import { useSessionStore } from '@/stores/session.store';

const props = defineProps<{ username: string }>();
const session = useSessionStore();

const BASE_TABS = [
  { route: 'user', key: 'overview' },
  { route: 'user-solved', key: 'solved' },
  { route: 'user-pp', key: 'pp' },
  { route: 'user-blog', key: 'blog' },
] as const;
const COMMENTS_TAB = { route: 'user-comments', key: 'comments' } as const;

const tabs = computed(() =>
  hasPermission(session.user, 'judge.view_all_user_comment')
    ? [...BASE_TABS, COMMENTS_TAB]
    : BASE_TABS,
);
</script>

<template>
  <nav
    :aria-label="$t('profileTabs.title')"
    class="flex gap-1 overflow-x-auto border-b border-line"
  >
    <RouterLink
      v-for="tab in tabs"
      :key="tab.route"
      :to="{ name: tab.route, params: { username: props.username } }"
      exact-active-class="border-accent font-semibold text-content"
      class="-mb-px flex min-h-11 items-center border-b-2 border-transparent px-4 text-muted hover:text-content"
    >
      {{ $t(`profile.tabs.${tab.key}`) }}
    </RouterLink>
  </nav>
</template>
