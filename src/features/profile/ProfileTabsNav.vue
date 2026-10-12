<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import PillTabs, { type PillTab } from '@/components/PillTabs.vue';
import { hasPermission } from '@/lib/permissions';
import { useSessionStore } from '@/stores/session.store';

const props = defineProps<{ username: string }>();
const session = useSessionStore();
const { t } = useI18n();

const BASE_TABS = [
  { route: 'user', key: 'overview' },
  { route: 'user-solved', key: 'solved' },
  { route: 'user-pp', key: 'pp' },
  { route: 'user-blog', key: 'blog' },
] as const;
const COMMENTS_TAB = { route: 'user-comments', key: 'comments' } as const;

const tabs = computed<PillTab[]>(() =>
  (hasPermission(session.user, 'judge.view_all_user_comment')
    ? [...BASE_TABS, COMMENTS_TAB]
    : BASE_TABS
  ).map((tab) => ({
    key: tab.route,
    label: t(`profile.tabs.${tab.key}`),
    to: { name: tab.route, params: { username: props.username } },
  })),
);
</script>

<template>
  <PillTabs :tabs="tabs" :label="t('profileTabs.title')" />
</template>
