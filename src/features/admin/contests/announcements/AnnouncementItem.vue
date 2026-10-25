<script setup lang="ts">
import { Pencil, Send, Trash2 } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { deleteAnnouncement, resendAnnouncement } from '@/api/contest-editing.api';
import type { Announcement } from '@/api/types/contest-editing';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import UserContent from '@/components/UserContent.vue';
import { formatDate } from '@/lib/format-date';
import { translate } from '@/i18n';
import { useLocaleStore } from '@/stores/locale.store';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { CARD, buttonClass } from '../../ui/controls';
import AdminRowMenu from '../../ui/table/AdminRowMenu.vue';
import type { RowMenuItem } from '../../ui/table/AdminRowMenu.vue';
import AnnouncementEditForm from './AnnouncementEditForm.vue';
import { composeHeading } from './composer-heading';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import type { AdminQueryKey } from '../../ui/use-admin-mutation';

const props = defineProps<{
  contestKey: string;
  announcement: Announcement;
  isJustPosted: boolean;
  /** Resend only publishes to the live channel: with it off the backend sends nothing and still answers 204. */
  isPushedLive: boolean;
}>();
const locale = useLocaleStore();
const isConfirmOpen = ref(false);
const isEditing = ref(false);
const listKey = (): AdminQueryKey => ['admin', 'contest-announcements', props.contestKey];
const when = computed(() =>
  props.isJustPosted
    ? translate('admin.contests.announcements.justPosted')
    : formatDate(props.announcement.createdAt, 'datetime', locale.locale),
);

const resend = useAdminMutation({
  mutate: () => resendAnnouncement(props.contestKey, props.announcement.id),
  successText: () => translate('admin.contests.announcements.resent'),
});
const remove = useAdminMutation({
  mutate: () => deleteAnnouncement(props.contestKey, props.announcement.id),
  invalidates: () => [listKey(), ['contests', 'announcements']],
  successText: () =>
    translate('admin.contestOps.announcements.deleted', { title: props.announcement.title }),
  onDone: () => {
    isConfirmOpen.value = false;
  },
});

/** Resend only exists with the live channel on; delete is last (destructive, confirmed). */
const menuItems = computed<RowMenuItem[]>(() => [
  ...(props.isPushedLive
    ? [
        {
          label: translate('admin.contests.announcements.resend'),
          icon: Send,
          run: () => void resend.run(undefined),
        },
      ]
    : []),
  {
    label: translate('common.delete'),
    icon: Trash2,
    danger: true,
    run: () => {
      remove.reset();
      isConfirmOpen.value = true;
    },
  },
]);
</script>

<template>
  <article :class="[CARD, 'flex flex-col gap-3 p-5']">
    <header class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 flex-col gap-0.5">
        <h3 class="m-0 text-base font-semibold break-words">{{ announcement.title }}</h3>
        <time class="text-xs text-muted" :datetime="announcement.createdAt">{{ when }}</time>
      </div>
      <div v-if="!isEditing" class="flex shrink-0 items-center gap-1">
        <button type="button" :class="buttonClass('ghost', 'sm')" @click="isEditing = true">
          <Pencil aria-hidden="true" class="size-4" :stroke-width="1.75" />
          {{ $t('common.edit') }}
        </button>
        <AdminRowMenu
          :items="menuItems"
          :label="$t('admin.contestOps.announcements.more', { title: announcement.title })"
        />
      </div>
    </header>
    <AnnouncementEditForm
      v-if="isEditing"
      :contest-key="contestKey"
      :announcement="announcement"
      @close="isEditing = false"
    />
    <UserContent v-else :html="announcement.descriptionHtml" />
    <AdminStatus
      v-if="resend.failure.value"
      kind="refused"
      :text="failureTextOf(resend.failure.value)"
    />
    <ConfirmDialog
      v-model:visible="isConfirmOpen"
      :title="$t('admin.contests.announcements.deleteTitle', { title: announcement.title })"
      :body="$t('admin.contests.announcements.deleteBody')"
      tone="danger"
      :return-focus-to="composeHeading"
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
