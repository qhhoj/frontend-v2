<script setup lang="ts">
import { computed } from 'vue';
import SettingsNotice from '@/features/account/settings/SettingsNotice.vue';
import { ORG_BITS } from '../org-bits';
import { useArchivedInQuery } from './org-problems.queries';

/** The notice above a problem one of the viewer's organizations archived; archiving never hides it from them. */
const props = defineProps<{ code: string; organizationIds: string[] }>();
const { data } = useArchivedInQuery(
  () => props.code,
  () => props.organizationIds.length > 0,
);
const names = computed(() =>
  (data.value?.organizations ?? []).map((organization) => organization.name).join(', '),
);
</script>

<template>
  <SettingsNotice
    v-if="names"
    data-testid="archived-notice"
    tone="info"
    :bit="ORG_BITS.archivedNotice"
  >
    {{ $t('problemArchive.notice', { names }) }}
  </SettingsNotice>
</template>
