import { computed, reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { createFlatpage, deleteFlatpage, updateFlatpage } from '@/api/flatpages-admin.api';
import type { FlatpageAdmin, FlatpageBody } from '@/api/types/flatpages-admin';
import { useViewerId } from '@/stores/use-viewer-id';
import { useAdminMutation } from '../ui/use-admin-mutation';
import type { FieldErrors } from '../ui/admin-errors';
import {
  canonicalUrl,
  changedFlatpageFields,
  checkFlatpageForm,
  serverUrlError,
} from './flatpage-form';
import { flatpageKey, useFlatpageQuery } from './flatpages.queries';

const BLANK_FORM: FlatpageBody = { url: '', title: '', content: '', registrationRequired: false };
export const bodyOf = (page: FlatpageAdmin): FlatpageBody => ({
  url: page.url,
  title: page.title,
  content: page.content,
  registrationRequired: page.registrationRequired,
});

interface SaveRequest {
  id: string | null;
  body: FlatpageBody;
  patch: Partial<FlatpageBody>;
}

/** The form follows the page on screen: blank for a new page, the saved copy once it has loaded, blank again for a page not loaded yet. */
function useFollowingForm(pageId: () => string | null, page: Ref<FlatpageAdmin | undefined>) {
  const form = reactive<FlatpageBody>({ ...BLANK_FORM });
  let syncedId: string | null = null;

  function fillForm(body: FlatpageBody, id: string | null) {
    syncedId = id;
    Object.assign(form, body);
  }

  watch([pageId, page], ([id, loaded]) => {
    if (id === null) return fillForm(BLANK_FORM, null);
    if (loaded?.id === id && syncedId !== id) return fillForm(bodyOf(loaded), id);
    if (syncedId !== id) Object.assign(form, BLANK_FORM);
  });

  return form;
}

interface WriteOptions {
  pageId: () => string | null;
  saved: Ref<FlatpageAdmin | null>;
  form: FlatpageBody;
  onCreated: (id: string) => void;
}

/** The save: a new page is created, a saved one gets only its changed fields; the URL is sent canonical. */
function useFlatpageSave({ pageId, saved, form, onCreated }: WriteOptions) {
  const queryClient = useQueryClient();
  const viewer = useViewerId();
  const clientErrors = ref<FieldErrors>({});
  const isNothingToSave = ref(false);

  const writer = useAdminMutation<SaveRequest, FlatpageAdmin>({
    mutate: ({ id, body, patch }) =>
      id === null ? createFlatpage(body) : updateFlatpage(id, patch),
    invalidates: ({ id }) =>
      id === null
        ? [['admin', 'flatpages']]
        : [
            ['admin', 'flatpages'],
            ['admin', 'flatpage-revisions', id],
          ],
    onDone: (page, { id }) => {
      queryClient.setQueryData(flatpageKey(page.id, viewer.value), page);
      isNothingToSave.value = false;
      if (id === null) onCreated(page.id);
    },
  });

  function save() {
    writer.reset();
    isNothingToSave.value = false;
    clientErrors.value = checkFlatpageForm(form);
    if (Object.keys(clientErrors.value).length > 0) return;
    const id = pageId();
    const body = { ...form, url: canonicalUrl(form.url) ?? form.url };
    const patch = saved.value ? changedFlatpageFields(bodyOf(saved.value), form) : {};
    if (id !== null && Object.keys(patch).length === 0) {
      isNothingToSave.value = true;
      return;
    }
    void writer.run({ id, body, patch: id === null ? body : patch });
  }

  return { writer, clientErrors, isNothingToSave, save };
}

interface EditorOptions {
  pageId: () => string | null;
  onCreated: (id: string) => void;
  onDeleted: () => void;
}

/** The page editor's state: the form, the saved copy, the save, the delete and the discard. */
export function useFlatpageEditor({ pageId, onCreated, onDeleted }: EditorOptions) {
  const pageQuery = useFlatpageQuery(pageId);
  const saved = computed(() => pageQuery.data.value ?? null);
  const form = useFollowingForm(
    pageId,
    computed(() => pageQuery.data.value),
  );
  const save = useFlatpageSave({ pageId, saved, form, onCreated });
  const remover = useAdminMutation<string, void>({
    mutate: (id) => deleteFlatpage(id),
    invalidates: () => [['admin', 'flatpages']],
    onDone: () => onDeleted(),
  });

  function discard() {
    save.writer.reset();
    save.clientErrors.value = {};
    Object.assign(form, saved.value ? bodyOf(saved.value) : BLANK_FORM);
  }

  /** The URL error wins over the English backend text: the server's own refusal is re-worded under the box. */
  const fieldErrors = computed<FieldErrors>(() => {
    const url =
      save.clientErrors.value.url ??
      serverUrlError(save.writer.failure.value, canonicalUrl(form.url) ?? form.url);
    return {
      ...save.writer.fieldErrors.value,
      ...save.clientErrors.value,
      ...(url ? { url } : {}),
    };
  });

  return { form, saved, pageQuery, ...save, remover, fieldErrors, discard };
}
