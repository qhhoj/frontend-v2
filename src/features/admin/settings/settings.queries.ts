import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchSettingRevisions, fetchSettings } from '@/api/settings-admin.api';
import type { Setting, SettingKey } from '@/api/types/settings-admin';
import { useViewerId } from '@/stores/use-viewer-id';

/** Every cached list of settings starts with this prefix; a write updates them through it. */
export const settingsKey = ['admin', 'settings'] as const;
/** The revisions of one key; a write to that key invalidates them through the key's prefix. */
export const settingRevisionsPrefix = (key: SettingKey) =>
  ['admin', 'setting-revisions', key] as const;

export function useSettingsQuery(isEnabled: MaybeRefOrGetter<boolean> = true) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [...settingsKey, viewer.value]),
    queryFn: fetchSettings,
    enabled: computed(() => toValue(isEnabled)),
  });
}

export function useSettingRevisionsQuery(
  key: MaybeRefOrGetter<SettingKey>,
  page: MaybeRefOrGetter<number>,
) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [
      ...settingRevisionsPrefix(toValue(key)),
      toValue(page),
      viewer.value,
    ]),
    queryFn: () => fetchSettingRevisions(toValue(key), toValue(page)),
  });
}

/**
 * Writes one key's answer into every cached settings list, whoever the viewer is, and drops that key's revisions
 * (the write added one). Components never build a setting themselves: the answer is what the server saved.
 */
export function useStoreSettingAnswer() {
  const queryClient = useQueryClient();
  return (answer: Setting) => {
    queryClient.setQueriesData<Setting[]>({ queryKey: settingsKey }, (list) =>
      list?.map((entry) => (entry.key === answer.key ? answer : entry)),
    );
    void queryClient.invalidateQueries({ queryKey: settingRevisionsPrefix(answer.key) });
  };
}
