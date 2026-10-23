import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import { postAnnouncement } from '@/api/contest-editing.api';
import type { Announcement } from '@/api/types/contest-editing';
import type { FieldErrors } from '../../ui/admin-errors';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { checkAnnouncementDraft } from './announcement-check';

/**
 * The announcement draft and its post, shared by the admin composer and the one on the public Announcements tab. The
 * draft is cleared once posted and kept when the backend refuses it, so the writer can fix it and send again.
 */
export function useAnnouncementComposer(
  contestKey: Ref<string>,
  options: { successText?: () => string; onPosted?: (announcement: Announcement) => void } = {},
) {
  const title = ref('');
  const description = ref('');
  const post = useAdminMutation({
    mutate: (draft: { title: string; description: string }) =>
      postAnnouncement(contestKey.value, draft),
    invalidates: () => [
      ['admin', 'contest-announcements', contestKey.value],
      ['contests', 'announcements'],
    ],
    successText: options.successText,
    onDone: (created: Announcement) => {
      title.value = '';
      description.value = '';
      options.onPosted?.(created);
    },
  });
  /** The draft is checked here first, so a title the backend would refuse never costs a round trip. */
  const localErrors = ref<FieldErrors>({});
  const errors = computed(() => ({ ...localErrors.value, ...post.fieldErrors.value }));
  function submit() {
    localErrors.value = checkAnnouncementDraft({ title: title.value });
    if (Object.keys(localErrors.value).length > 0) return undefined;
    return post.run({ title: title.value, description: description.value });
  }
  return { title, description, post, errors, submit };
}
