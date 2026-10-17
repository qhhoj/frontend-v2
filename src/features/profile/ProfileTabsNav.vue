<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import PillTabs, { type PillTab } from '@/components/PillTabs.vue';
import { useUserSubmissionCountQuery } from '@/features/users/users.queries';
import { formatNumber } from '@/lib/format';
import { hasPermission } from '@/lib/permissions';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { USER_COMMENTS_PERMISSION } from './user-comments-access';

const props = defineProps<{ username: string }>();
const session = useSessionStore();
const locale = useLocaleStore();
const { t } = useI18n();
const { data: submissionCount } = useUserSubmissionCountQuery(() => props.username);

const tabOf = (route: string, key: string): PillTab => ({
  key: route,
  label: t(`profile.tabs.${key}`),
  to: { name: route, params: { username: props.username } },
});
/** P-07 A: the user's submissions are one tap away, on the site list filtered to them, with their count. */
const submissionsTab = computed<PillTab>(() => {
  const count = submissionCount.value;
  const text = count == null ? null : formatNumber(count, locale.locale);
  return {
    key: 'submissions',
    label: t('profile.tabs.submissions'),
    to: { name: 'submissions', query: { user: props.username } },
    badge:
      text === null
        ? undefined
        : {
            text,
            tone: 'neutral',
            srLabel: t('profile.tabs.submissionCount', { count: text }, count!),
          },
  };
});
const tabs = computed<PillTab[]>(() => [
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
  <PillTabs :tabs="tabs" :label="t('profileTabs.title')" />
</template>
