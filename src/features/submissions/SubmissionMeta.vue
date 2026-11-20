<script setup lang="ts">
import LanguageLabel from '@/components/language/LanguageLabel.vue';
import UserLink from '@/components/UserLink.vue';
import type { SubmissionDetail } from '@/api/types/submissions';
import type { SubmissionInContest } from '@/features/contests/submission/submission-contest';
import { formatClock, formatDate, formatRelative } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';

/** "3 minutes ago" only needs a fresh clock once a minute. */
const CLOCK_REFRESH_MS = 60_000;

/**
 * The submission page's meta line: author, when (the minute of the run in a contest), language and, for staff only, the
 * judge machine that ran it (a student has no use for its name). It goes in the page header's `#meta` slot.
 */
defineProps<{ submission: SubmissionDetail; inContest?: SubmissionInContest | null }>();
const locale = useLocaleStore();
const session = useSessionStore();
const now = useNow(CLOCK_REFRESH_MS);
</script>

<template>
  <UserLink
    v-if="submission.user"
    :username="submission.user.username"
    :rating="submission.user.rating"
    size="sm"
  />
  <time
    :datetime="submission.date"
    :title="formatDate(submission.date, 'datetime', locale.locale)"
    >{{
      inContest?.minute != null
        ? $t('submission.contest.minute', {
            time: formatClock(submission.date),
            minute: inContest.minute,
          })
        : formatRelative(submission.date, now, locale.locale)
    }}</time
  >
  <LanguageLabel v-if="submission.language" :language="submission.language" />
  <span v-if="submission.judgedOn && session.isStaff" data-testid="judged-on" class="font-mono">{{
    submission.judgedOn
  }}</span>
</template>
