import { computed, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { uploadProblemImage } from '@/api/problem-editing.api';
import { usePermissions } from '@/stores/use-permissions';
import { useSessionStore } from '@/stores/session.store';
import { useAdminMutation } from '../ui/use-admin-mutation';

/**
 * The shared logo logic of the admin editor and the organization settings: who may upload (staff or `judge.can_upload_image`,
 * the statement image endpoint's rule), the upload itself (its URL fills `logo`), the broken-image flag and `isUploading`, which
 * the form uses to hold its save so it never saves the old logo under a "Saved".
 */
export function useLogoUpload(logo: Ref<string>, isUploading: Ref<boolean>) {
  const session = useSessionStore();
  const { can } = usePermissions();
  const canUpload = computed(() => session.isStaff || can('judge.can_upload_image'));
  const hasFailed = ref(false);
  const upload = useAdminMutation({
    mutate: uploadProblemImage,
    onDone: (url: string) => (logo.value = url),
  });
  watch(upload.isPending, (pending) => (isUploading.value = pending));
  /** A new value (typed or uploaded) clears the broken-image hint and an earlier upload refusal. */
  watch(logo, () => {
    hasFailed.value = false;
    upload.reset();
  });
  return { canUpload, hasFailed, upload };
}
