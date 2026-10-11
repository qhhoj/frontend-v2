import { computed, reactive, ref, watch } from 'vue';
import {
  removeExternalJudgeLink,
  saveExternalJudgeLink,
  verifyExternalJudgeProblem,
} from '@/api/external-judge.api';
import type { ExternalJudgeLinkState } from '@/api/types/external-judge';
import { useViewerId } from '@/stores/use-viewer-id';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { PUBLIC_PROBLEMS_KEY, editableProblemKey } from '../problem-editing.queries';
import { externalJudgeLinkKey } from './external-judge.queries';
import {
  duplicateSiteLanguages,
  linkBodyOf,
  mappingFromLink,
  mappingFromVerified,
} from './language-mapping';
import type { LanguageMapping } from './language-mapping';

interface RemoteLanguage {
  remoteId: string;
  remoteName: string;
}

/** The tab's form: the stored link seeds it; Verify refills the title and the remote languages; Save and Remove write. */
export function useExternalJudgeForm(
  code: () => string,
  stored: () => ExternalJudgeLinkState | undefined,
) {
  const viewer = useViewerId();
  const form = reactive({ isActive: true, oj: '', problemId: '', title: '' });
  const remoteLanguages = ref<RemoteLanguage[]>([]);
  const mapping = ref<LanguageMapping>({});

  watch(
    stored,
    (state) => {
      const link = state?.link;
      form.isActive = link?.isActive ?? true;
      form.oj = link?.oj ?? '';
      form.problemId = link?.problemId ?? '';
      form.title = link?.title ?? '';
      remoteLanguages.value = link?.languages ?? [];
      mapping.value = link ? mappingFromLink(link.languages) : {};
    },
    { immediate: true },
  );

  const invalidates = () => [
    externalJudgeLinkKey(code(), viewer.value),
    editableProblemKey(code(), viewer.value),
    PUBLIC_PROBLEMS_KEY,
  ];
  const verify = useAdminMutation({
    mutate: () => verifyExternalJudgeProblem(code(), form.oj.trim(), form.problemId.trim()),
    onSuccess: (verified) => {
      form.title = verified.title;
      remoteLanguages.value = verified.languages;
      mapping.value = mappingFromVerified(verified.languages, mapping.value);
    },
  });
  const save = useAdminMutation({
    mutate: () =>
      saveExternalJudgeLink(
        code(),
        linkBodyOf({ ...form, remoteLanguages: remoteLanguages.value, mapping: mapping.value }),
      ),
    invalidates,
  });
  const remove = useAdminMutation({
    mutate: () => removeExternalJudgeLink(code()),
    invalidates,
  });

  const duplicates = computed(() => duplicateSiteLanguages(mapping.value));
  const canVerify = computed(() => form.oj.trim() !== '' && form.problemId.trim() !== '');
  const canSave = computed(() => canVerify.value && duplicates.value.size === 0);
  return { form, remoteLanguages, mapping, duplicates, canVerify, canSave, verify, save, remove };
}
