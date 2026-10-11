<script setup lang="ts">
import { ref } from 'vue';
import { postAnnouncement } from '@/api/contest-editing.api';
import type { Announcement } from '@/api/types/contest-editing';
import AdminBit from '../../shell/AdminBit.vue';
import AdminField from '../../ui/AdminField.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { CARD, INPUT, buttonClass } from '../../ui/controls';
import { translate } from '@/i18n';
import { failureTextOf } from '../../ui/admin-errors';
import AnnouncementPreview from './AnnouncementPreview.vue';
import { COMPOSE_HEADING_ID } from './composer-heading';
import { useAdminMutation } from '../../ui/use-admin-mutation';

const props = defineProps<{ contestKey: string; isPushedLive: boolean }>();
const emit = defineEmits<{ posted: [announcement: Announcement] }>();
const title = ref('');
const description = ref('');

const post = useAdminMutation({
  mutate: (draft: { title: string; description: string }) =>
    postAnnouncement(props.contestKey, draft),
  invalidates: () => [
    ['admin', 'contest-announcements', props.contestKey],
    ['contests', 'announcements'],
  ],
  successText: () => translate('admin.contests.announcements.posted'),
  onDone: (created: Announcement) => {
    title.value = '';
    description.value = '';
    emit('posted', created);
  },
});

/** The draft is kept when the backend refuses it, so the writer can fix the title and send again. */
const submit = () => post.run({ title: title.value, description: description.value });
</script>

<template>
  <form
    :class="[CARD, 'flex flex-col gap-4 p-5 xl:sticky xl:top-16']"
    novalidate
    @submit.prevent="submit"
  >
    <header class="flex items-center gap-3">
      <AdminBit placement="composing" />
      <h2 :id="COMPOSE_HEADING_ID" tabindex="-1" class="m-0 text-base font-semibold">
        {{ $t('admin.contests.announcements.composeTitle') }}
      </h2>
    </header>
    <AdminField
      input-id="announcement-title"
      :label="$t('admin.contests.announcements.titleLabel')"
      :hint="$t('admin.contests.announcements.titleHint')"
      :error="post.fieldErrors.value.title"
    >
      <template #default="{ id, describedBy, invalid }">
        <input
          :id="id"
          v-model="title"
          :class="INPUT"
          :aria-describedby="describedBy"
          :aria-invalid="invalid ? 'true' : undefined"
        />
      </template>
    </AdminField>
    <AdminField
      input-id="announcement-body"
      :label="$t('admin.contests.announcements.bodyLabel')"
      :error="post.fieldErrors.value.description"
    >
      <template #default="{ id, describedBy, invalid }">
        <textarea
          :id="id"
          v-model="description"
          rows="6"
          :class="[INPUT, 'py-2']"
          :aria-describedby="describedBy"
          :aria-invalid="invalid ? 'true' : undefined"
        />
      </template>
    </AdminField>
    <AnnouncementPreview
      v-if="description.trim()"
      :contest-key="contestKey"
      :markdown="description"
    />
    <p class="m-0 text-sm text-muted">
      {{
        isPushedLive
          ? $t('admin.contests.announcements.pushOn')
          : $t('admin.contests.announcements.pushOff')
      }}
    </p>
    <div class="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        :class="buttonClass('primary')"
        :aria-busy="post.isPending.value || undefined"
      >
        {{ $t('admin.contests.announcements.post') }}
      </button>
      <AdminStatus
        v-if="post.failure.value"
        kind="refused"
        :text="failureTextOf(post.failure.value)"
      />
    </div>
  </form>
</template>
