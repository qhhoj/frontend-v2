import { computed, ref, shallowRef } from 'vue';
import { uploadDataArchive } from '@/api/problem-data.api';
import type { ProblemData } from '@/api/types/problem-data';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { SINGLE_UPLOAD_MAX_BYTES } from './chunked-upload/chunk-plan';
import { UPLOAD_CANCELLED, useChunkedUpload } from './chunked-upload/use-chunked-upload';
import { useKeepDataAnswer } from './problem-data.queries';
import { LOOSE_ARCHIVE_NAME, routeUpload, sortDropped } from './test-upload';
import type { DropRefusal, WaitingUpload } from './test-upload';
import { zipStore } from './zip-store';

/**
 * The test upload of one problem. A `.zip` goes as it is; loose input and output files are packed into one stored zip in
 * the browser first (the API takes only an archive). Both go the same way: one request up to `SINGLE_UPLOAD_MAX_BYTES`,
 * resumable chunks above it. The server keeps one archive and cannot add files to it, so a `.zip` or loose files for a
 * problem that already has an archive wait in `waiting` until the teacher says to replace it; nothing stored is dropped silently.
 * `onStored` gets the server's answer after each upload.
 */
export function useTestUpload(
  code: () => string,
  hasArchive: () => boolean,
  onStored: (saved: ProblemData) => void,
) {
  const keepAnswer = useKeepDataAnswer(code);
  const chunked = useChunkedUpload(code);
  const refusal = ref<DropRefusal | null>(null);
  const waiting = shallowRef<WaitingUpload | null>(null);
  const isPacking = ref(false);
  const archive = useAdminMutation({
    mutate: (file: File) =>
      file.size > SINGLE_UPLOAD_MAX_BYTES ? chunked.upload(file) : uploadDataArchive(code(), file),
    onDone: (saved: ProblemData) => {
      keepAnswer(saved);
      onStored(saved);
    },
  });
  const isBusy = computed(() => isPacking.value || archive.isPending.value);

  /** Each file is read once, for its checksum; the archive is a view over the files, not a copy of them. */
  async function pack(files: readonly File[]): Promise<File | null> {
    isPacking.value = true;
    try {
      const entries = files.map((file) => ({
        name: file.name,
        data: file,
        modified: new Date(file.lastModified),
      }));
      return new File([await zipStore(entries)], LOOSE_ARCHIVE_NAME, { type: 'application/zip' });
    } catch {
      refusal.value = { reason: 'unreadable' };
      return null;
    } finally {
      isPacking.value = false;
    }
  }

  async function sendLoose(files: readonly File[]) {
    waiting.value = null;
    const zip = await pack(files);
    if (zip) await archive.run(zip);
  }

  function send(upload: WaitingUpload) {
    waiting.value = null;
    return upload.kind === 'zip' ? archive.run(upload.file) : sendLoose(upload.files);
  }

  /** What the teacher dropped or picked. While an upload runs nothing new is taken and the busy line says so. */
  function take(files: readonly File[]) {
    if (isBusy.value) {
      refusal.value = { reason: 'busy' };
      return;
    }
    refusal.value = null;
    waiting.value = null;
    const dropped = sortDropped(files);
    if (dropped.kind === 'refused') refusal.value = dropped;
    else if (routeUpload(hasArchive()) === 'wait') waiting.value = dropped;
    else void send(dropped);
  }

  /** Only the upload started on this problem is offered to resume here. */
  const interrupted = computed(() =>
    chunked.interrupted.value?.code === code() ? chunked.interrupted.value : null,
  );

  return {
    take,
    refuse: (reason: DropRefusal['reason']) => (refusal.value = { reason }),
    confirmReplace: () => (waiting.value ? send(waiting.value) : undefined),
    cancelReplace: () => (waiting.value = null),
    resume: () => (interrupted.value ? archive.run(interrupted.value.file) : undefined),
    waiting,
    refusal,
    isPacking,
    isBusy,
    /** A cancel is the user's own doing: no refusal line for it. */
    failure: computed(() =>
      archive.failure.value?.code === UPLOAD_CANCELLED ? null : archive.failure.value,
    ),
    chunked,
    interrupted,
  };
}
