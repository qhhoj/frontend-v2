<script setup lang="ts">
import { computed, ref } from 'vue';
import { updateAnnouncement } from '@/api/contest-admin.api';
import type { Announcement } from '@/api/types/contest-editing';
import AdminField from '../../ui/AdminField.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { INPUT, buttonClass } from '../../ui/controls';
import AdminLeaveGuard from '../../ui/form/AdminLeaveGuard.vue';
import { translate } from '@/i18n';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import AnnouncementPreview from './AnnouncementPreview.vue';

/** Fixes an announcement in place: it keeps its time and is not pushed again (resend does that). */
const props = defineProps<{ contestKey: string; announcement: Announcement }>();
const emit = defineEmits<{ close: [] }>();
const title = ref(props.announcement.title);
const description = ref(props.announcement.description);
/** An unsaved fix asks before another contest or screen replaces it. */
const dirtyCount = computed(
  () =>
    Number(title.value !== props.announcement.title) +
    Number(description.value !== props.announcement.description),
);

const save = useAdminMutation({
  mutate: () =>
    updateAnnouncement(props.contestKey, props.announcement.id, {
      title: title.value,
      description: description.value,
    }),
  invalidates: () => [
    ['admin', 'contest-announcements', props.contestKey],
    ['contests', 'announcements'],
  ],
  successText: () => translate('admin.contestOps.announcements.saved'),
  onDone: () => emit('close'),
});
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="save.run(undefined)">
    <AdminField
      :input-id="`announcement-edit-title-${announcement.id}`"
      :label="$t('admin.contests.announcements.titleLabel')"
      :error="save.fieldErrors.value.title"
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
      :input-id="`announcement-edit-body-${announcement.id}`"
      :label="$t('admin.contests.announcements.bodyLabel')"
      :error="save.fieldErrors.value.description"
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
    <AnnouncementPreview :contest-key="contestKey" :markdown="description" />
    <p class="m-0 text-sm text-muted">{{ $t('admin.contestOps.announcements.editNote') }}</p>
    <div class="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        :class="buttonClass('primary')"
        :aria-busy="save.isPending.value || undefined"
      >
        {{ $t('common.save') }}
      </button>
      <button type="button" :class="buttonClass('ghost')" @click="emit('close')">
        {{ $t('common.cancel') }}
      </button>
      <AdminStatus
        v-if="save.failure.value"
        kind="refused"
        :text="failureTextOf(save.failure.value)"
      />
    </div>
    <AdminLeaveGuard :dirty-count="dirtyCount" />
  </form>
</template>
