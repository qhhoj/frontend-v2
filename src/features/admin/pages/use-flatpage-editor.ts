import { computed, reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { createFlatpage, deleteFlatpage, updateFlatpage } from '@/api/flatpages-admin.api';
import type { FlatpageAdmin, FlatpageBody } from '@/api/types/flatpages-admin';
import { translate } from '@/i18n';
import { useViewerId } from '@/stores/use-viewer-id';
import { useAdminMutation } from '../ui/use-admin-mutation';
import type { AdminQueryKey } from '../ui/use-admin-mutation';
import type { FieldErrors } from '../ui/admin-errors';
import {
  canonicalUrl,
  changedFlatpageFields,
  checkFlatpageForm,
  serverUrlError,
} from './flatpage-form';
import { flatpageKey, PUBLIC_FLATPAGES_KEY, useFlatpageQuery } from './flatpages.queries';

export const BLANK_FORM: FlatpageBody = {
  url: '',
  title: '',
  content: '',
  registrationRequired: false,
};
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

/**
 * The form follows the page on screen: blank for a new page, the saved copy once it has loaded, blank again for a page not loaded yet.
 * A clean form (it still equals the copy it was last filled from) also follows a newer saved copy, so a later save never sends old text back.
 */
function useFollowingForm(pageId: () => string | null, page: Ref<FlatpageAdmin | undefined>) {
  const form = reactive<FlatpageBody>({ ...BLANK_FORM });
  let syncedId: string | null = null;

  function fillForm(body: FlatpageBody, id: string | null) {
    syncedId = id;
    Object.assign(form, body);
  }
  const isCleanAgainst = (previous: FlatpageAdmin | undefined, id: string) =>
    previous?.id === id && Object.keys(changedFlatpageFields(bodyOf(previous), form)).length === 0;

  watch([pageId, page], ([id, loaded], [, previous]) => {
    if (id === null) return fillForm(BLANK_FORM, null);
    if (loaded?.id === id && syncedId !== id) return fillForm(bodyOf(loaded), id);
    if (syncedId !== id) return void Object.assign(form, BLANK_FORM);
    if (loaded?.id === id && isCleanAgainst(previous, id)) fillForm(bodyOf(loaded), id);
  });

  return form;
}

/**
 * The page this editor has just created. It is set before the route replace resolves, so a save in that window
 * updates the new page instead of creating a second one. It is dropped once the page on screen changes.
 */
function useCreatedPage(pageId: () => string | null) {
  const createdPage = ref<FlatpageAdmin | null>(null);
  watch(pageId, () => (createdPage.value = null));
  return createdPage;
}

interface WriteOptions {
  pageId: () => string | null;
  saved: Ref<FlatpageAdmin | null>;
  createdPage: Ref<FlatpageAdmin | null>;
  form: FlatpageBody;
  onCreated: (id: string) => void;
}

/** A save changes the admin list and the public pages, and an edit also changes the page's history. */
function keysToRefreshAfterSave(id: string | null): AdminQueryKey[] {
  const keys: AdminQueryKey[] = [['admin', 'flatpages'], PUBLIC_FLATPAGES_KEY];
  return id === null ? keys : [...keys, ['admin', 'flatpage-revisions', id]];
}

/** The save: a new page is created, a saved one gets only its changed fields; the URL is sent canonical. */
function useFlatpageSave({ pageId, saved, createdPage, form, onCreated }: WriteOptions) {
  const queryClient = useQueryClient();
  const viewer = useViewerId();
  const clientErrors = ref<FieldErrors>({});
  const isNothingToSave = ref(false);

  const writer = useAdminMutation<SaveRequest, FlatpageAdmin>({
    mutate: ({ id, body, patch }) =>
      id === null ? createFlatpage(body) : updateFlatpage(id, patch),
    invalidates: ({ id }) => keysToRefreshAfterSave(id),
    successText: () => translate('admin.pages.saved'),
    onDone: (page, { id }) => {
      queryClient.setQueryData(flatpageKey(page.id, viewer.value), page);
      isNothingToSave.value = false;
      if (id === null) {
        createdPage.value = page;
        onCreated(page.id);
      }
    },
  });

  /** What a save sends, or null when a saved page has no changed field. */
  function requestOf(): SaveRequest | null {
    const id = pageId() ?? createdPage.value?.id ?? null;
    const body = { ...form, url: canonicalUrl(form.url) ?? form.url };
    if (id === null) return { id, body, patch: body };
    const baseline = saved.value ?? createdPage.value;
    const patch = baseline ? changedFlatpageFields(bodyOf(baseline), form) : {};
    return Object.keys(patch).length > 0 ? { id, body, patch } : null;
  }

  function save() {
    writer.reset();
    isNothingToSave.value = false;
    clientErrors.value = checkFlatpageForm(form);
    if (Object.keys(clientErrors.value).length > 0) return;
    const request = requestOf();
    if (request) void writer.run(request);
    else isNothingToSave.value = true;
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
  const createdPage = useCreatedPage(pageId);
  const save = useFlatpageSave({ pageId, saved, createdPage, form, onCreated });
  const queryClient = useQueryClient();
  const viewer = useViewerId();
  const remover = useAdminMutation<string, void>({
    mutate: (id) => deleteFlatpage(id),
    invalidates: () => [['admin', 'flatpages'], PUBLIC_FLATPAGES_KEY],
    successText: () => translate('admin.pages.deletedToast'),
    onDone: (_result, id) => {
      queryClient.removeQueries({ queryKey: flatpageKey(id, viewer.value) });
      queryClient.removeQueries({ queryKey: ['admin', 'flatpage-revisions', id] });
      onDeleted();
    },
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

  /** Fields that differ from the saved page (or from a blank form for a new one): the save bar's count. */
  const dirtyCount = computed(() => {
    const baseline = saved.value ?? createdPage.value;
    return Object.keys(changedFlatpageFields(baseline ? bodyOf(baseline) : BLANK_FORM, form))
      .length;
  });

  return { form, saved, pageQuery, ...save, remover, fieldErrors, discard, dirtyCount };
}
