<script setup lang="ts">
import { computed } from 'vue';
import StatePanel from '@/components/StatePanel.vue';
import SubmissionList from '@/features/submissions/list/SubmissionList.vue';
import type { ProblemPickerSource } from '@/features/submissions/list/problem-picker-options';
import type { SubmissionScope } from '@/features/submissions/list/submission-scope';
import { usePermissions } from '@/stores/use-permissions';
import { useOrganization } from '../use-organization';

/** Legacy `SubmissionListOrganization`: the site's submission list, narrowed to the members' rows. */
const { slug, query: organizationQuery } = useOrganization();
const { can } = usePermissions();
const viewer = computed(() => organizationQuery.data.value?.viewer ?? null);
/** Members and administrators pick from the organization's problems; the bypass permission alone does not open that list. */
const isInside = computed(() => Boolean(viewer.value?.isMember || viewer.value?.canAdminister));
const canRead = computed(() => isInside.value || can('judge.view_all_submission'));
const scope = computed<SubmissionScope>(() => ({ kind: 'organization', slug: slug.value }));
const problemSource = computed<ProblemPickerSource>(() =>
  isInside.value ? { kind: 'organization', slug: slug.value } : { kind: 'code' },
);
</script>

<template>
  <StatePanel
    v-if="organizationQuery.data.value && !canRead"
    kind="forbidden"
    :title="$t('orgAdmin.submissions.forbiddenTitle')"
  />
  <SubmissionList
    v-else-if="organizationQuery.data.value"
    :scope="scope"
    :enabled="canRead"
    :problem-source="problemSource"
    empty-key="orgAdmin.submissions.empty"
  />
</template>
