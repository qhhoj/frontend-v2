<script setup lang="ts">
import { computed, ref } from 'vue';
import { deleteAnnouncement, resendAnnouncement } from '@/api/contest-editing.api';
import type { Announcement } from '@/api/types/contest-editing';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import UserContent from '@/components/UserContent.vue';
import { formatDateTime } from '@/lib/format';
import { translate } from '@/i18n';
import { useLocaleStore } from '@/stores/locale.store';
import AdminStatus from '../../ui/AdminStatus.vue';
import { ADMIN_BUTTON_CLASS, ADMIN_DANGER_CLASS } from '../../ui/classes';
import { failureTextOf } from '../../ui/admin-errors';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import type { AdminQueryKey } from '../../ui/use-admin-mutation';

const props = defineProps<{
  contestKey: string;
  announcement: Announcement;
  isJustPosted: boolean;
}>();
const locale = useLocaleStore();
const isConfirmOpen = ref(false);
const isResent = ref(false);
const listKey = (): AdminQueryKey => ['admin', 'contest-announcements', props.contestKey];
const when = computed(() =>
  props.isJustPosted
    ? translate('admin.contests.announcements.justPosted')
    : formatDateTime(props.announcement.createdAt, locale.locale),
);

const resend = useAdminMutation({
  mutate: () => resendAnnouncement(props.contestKey, props.announcement.id),
  onDone: () => {
    isResent.value = true;
  },
});
const remove = useAdminMutation({
  mutate: () => deleteAnnouncement(props.contestKey, props.announcement.id),
  invalidates: () => [listKey()],
  onDone: () => {
    isConfirmOpen.value = false;
  },
});

async function resendNow() {
  isResent.value = false;
  await resend.run(undefined);
}
</script>

<template>
  <article class="glass flex flex-col gap-3 rounded-panel p-5">
    <header class="flex flex-wrap items-baseline justify-between gap-2">
      <h3 class="font-display text-lg font-semibold">{{ announcement.title }}</h3>
      <time class="text-sm text-muted" :datetime="announcement.createdAt">{{ when }}</time>
    </header>
    <UserContent :html="announcement.descriptionHtml" />
    <div class="flex flex-wrap items-center gap-3">
      <button type="button" :class="ADMIN_BUTTON_CLASS" @click="resendNow">
        {{ $t('admin.contests.announcements.resend') }}
      </button>
      <button type="button" :class="ADMIN_DANGER_CLASS" @click="isConfirmOpen = true">
        {{ $t('admin.contests.announcements.delete') }}
      </button>
      <AdminStatus v-if="isResent" kind="done" :text="$t('admin.contests.announcements.resent')" />
      <AdminStatus
        v-if="resend.failure.value"
        kind="refused"
        :text="failureTextOf(resend.failure.value)"
      />
    </div>
    <ConfirmDialog
      v-model:visible="isConfirmOpen"
      :title="$t('admin.contests.announcements.deleteTitle', { title: announcement.title })"
      :body="$t('admin.contests.announcements.deleteBody')"
      :confirm-label="$t('admin.contests.announcements.delete')"
      tone="danger"
      :busy="remove.isPending.value"
      @confirm="remove.run(undefined)"
    >
      <template #error>
        <p v-if="remove.failure.value" role="alert" class="text-sm text-negative">
          {{ failureTextOf(remove.failure.value) }}
        </p>
      </template>
    </ConfirmDialog>
  </article>
</template>
