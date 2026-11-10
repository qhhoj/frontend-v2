<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Tabs from '@/components/ui/Tabs.vue';
import type { TabItem } from '@/components/ui/Tabs.vue';
import { useUserPageQuery } from '@/features/users/users.queries';
import { formatNumber } from '@/lib/format';
import { hasPermission } from '@/lib/permissions';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { USER_COMMENTS_PERMISSION } from './user-comments-access';

const props = defineProps<{ username: string }>();
const session = useSessionStore();
const locale = useLocaleStore();
const { t } = useI18n();
/** The user page (already loaded by the profile header) carries the count the viewer may see. */
const { data: user } = useUserPageQuery(() => props.username);

const tabOf = (route: string, key: string): TabItem => ({
  key: route,
  label: t(`profile.tabs.${key}`),
  to: { name: route, params: { username: props.username } },
});
/** The user's submissions are one tap away, on the site list filtered to them, with their count. */
const submissionsTab = computed<TabItem>(() => {
  const count = user.value?.submissionCount;
  const text = count == null ? null : formatNumber(count, locale.locale);
  return {
    key: 'submissions',
    label: t('profile.tabs.submissions'),
    to: { name: 'submissions', query: { user: props.username } },
    count: text,
    countLabel:
      text === null ? undefined : t('profile.tabs.submissionCount', { count: text }, count!),
    countTone: 'neutral',
    countTestid: 'tab-badge',
  };
});
const tabs = computed<TabItem[]>(() => [
  tabOf('user', 'overview'),
  tabOf('user-solved', 'solved'),
  submissionsTab.value,
  tabOf('user-pp', 'pp'),
  tabOf('user-blog', 'blog'),
  ...(hasPermission(session.user, USER_COMMENTS_PERMISSION)
    ? [tabOf('user-comments', 'comments')]
    : []),
]);
</script>
<template>
  <Tabs :items="tabs" :label="t('profileTabs.title')" overflow="menu" />
</template>
