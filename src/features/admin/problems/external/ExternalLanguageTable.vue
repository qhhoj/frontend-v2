<script setup lang="ts">
import type { LanguageOption } from '@/api/types/problem-editing';
import { INPUT } from '../../ui/controls';
import type { LanguageMapping } from './language-mapping';

/** Each remote language with the site language it is sent as. A site language can be used once. */
const props = defineProps<{
  remoteLanguages: { remoteId: string; remoteName: string }[];
  languages: LanguageOption[];
  duplicates: Set<string>;
}>();
const mapping = defineModel<LanguageMapping>({ required: true });

const pick = (remoteId: string, siteLanguageId: string) =>
  (mapping.value = { ...mapping.value, [remoteId]: siteLanguageId });
const isTakenElsewhere = (remoteId: string, siteLanguageId: string) =>
  props.remoteLanguages.some(
    (other) => other.remoteId !== remoteId && mapping.value[other.remoteId] === siteLanguageId,
  );
</script>

<template>
  <table class="w-full text-left text-sm" data-testid="external-language-table">
    <caption class="sr-only">
      {{
        $t('admin.externalJudge.languages.caption')
      }}
    </caption>
    <thead class="text-muted">
      <tr>
        <th scope="col" class="py-2 pr-3">{{ $t('admin.externalJudge.languages.remote') }}</th>
        <th scope="col" class="py-2">{{ $t('admin.externalJudge.languages.site') }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="remote in remoteLanguages" :key="remote.remoteId" class="border-t border-line">
        <th scope="row" class="py-2 pr-3 font-normal">
          {{ remote.remoteName }}
          <span class="font-mono text-xs text-muted">{{ remote.remoteId }}</span>
        </th>
        <td class="py-2">
          <select
            :value="mapping[remote.remoteId] ?? ''"
            :aria-label="$t('admin.externalJudge.languages.pick', { name: remote.remoteName })"
            :aria-invalid="duplicates.has(mapping[remote.remoteId] ?? '') || undefined"
            :class="INPUT"
            @change="pick(remote.remoteId, ($event.target as HTMLSelectElement).value)"
          >
            <option value="">{{ $t('admin.externalJudge.languages.unused') }}</option>
            <option
              v-for="language in languages"
              :key="language.id"
              :value="language.id"
              :disabled="isTakenElsewhere(remote.remoteId, language.id)"
            >
              {{ language.name }}
            </option>
          </select>
        </td>
      </tr>
    </tbody>
  </table>
</template>
