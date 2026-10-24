<script setup lang="ts">
import { Send } from 'lucide-vue-next';
import { computed } from 'vue';
import type { ContestDetail } from '@/api/types/contests';
import AppButton from '@/components/ui/AppButton.vue';
import Card from '@/components/ui/Card.vue';
import FormField from '@/components/ui/FormField.vue';
import Notice from '@/components/ui/Notice.vue';
import TextArea from '@/components/ui/TextArea.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { failureTextOf } from '@/features/admin/ui/admin-errors';
import { useAnnouncementComposer } from '@/features/admin/contests/announcements/use-announcement-composer';

/**
 * The organisers' composer at the top of the public Announcements tab: the admin composer's draft and post, in the
 * public look. Says who it reaches: the contestants when the contest pushes announcements, else nobody until it is turned on.
 */
const props = defineProps<{ contest: ContestDetail }>();
const { title, description, post, errors, submit } = useAnnouncementComposer(
  computed(() => props.contest.key),
);
const hasFieldErrors = computed(() => Object.keys(errors.value).length > 0);
const isPushedLive = computed(() => props.contest.settings?.pushAnnouncements ?? false);
</script>

<template>
  <Card
    as="form"
    padding="md"
    class="border-accent!"
    :title="$t('contests.announcements.compose.title')"
    novalidate
    data-testid="announcement-composer"
    @submit.prevent="submit"
  >
    <template #actions>
      <span class="text-meta text-muted">{{
        $t('contests.announcements.compose.onlyOrganisers')
      }}</span>
    </template>
    <div class="flex flex-col gap-5">
      <FormField
        input-id="contest-announcement-title"
        :label="$t('contests.announcements.compose.titleLabel')"
        :error="errors.title"
      >
        <TextInput
          v-model="title"
          name="title"
          :placeholder="$t('contests.announcements.compose.titlePlaceholder')"
        />
      </FormField>
      <FormField
        input-id="contest-announcement-body"
        :label="$t('contests.announcements.compose.bodyLabel')"
        :hint="$t('contests.announcements.compose.bodyHint')"
        :error="errors.description"
      >
        <TextArea v-model="description" name="description" rows="3" />
      </FormField>
      <Notice v-if="post.failure.value && !hasFieldErrors" tone="danger" role="alert">
        {{ failureTextOf(post.failure.value) }}
      </Notice>
      <div class="flex flex-wrap items-center justify-end gap-3">
        <p class="text-meta text-muted" role="status">
          <template v-if="post.isDone.value">{{
            $t('contests.announcements.compose.posted')
          }}</template>
          <template v-else-if="isPushedLive">{{
            $t(
              'contests.announcements.compose.recipients',
              { count: contest.userCount },
              contest.userCount,
            )
          }}</template>
          <template v-else>{{ $t('contests.announcements.compose.notPushed') }}</template>
        </p>
        <AppButton type="submit" tone="primary" :loading="post.isPending.value">
          <template #icon><Send aria-hidden="true" class="size-4" /></template>
          {{ $t('contests.announcements.compose.post') }}
        </AppButton>
      </div>
    </div>
  </Card>
</template>
