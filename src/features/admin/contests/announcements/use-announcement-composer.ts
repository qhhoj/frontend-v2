import { ref } from 'vue';
import type { Ref } from 'vue';
import { postAnnouncement } from '@/api/contest-editing.api';
import type { Announcement } from '@/api/types/contest-editing';
import { useAdminMutation } from '../../ui/use-admin-mutation';

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
  const submit = () => post.run({ title: title.value, description: description.value });
  return { title, description, post, submit };
}
