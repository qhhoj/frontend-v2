<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import UserLink from '@/components/UserLink.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Chip from '@/components/ui/Chip.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import PageLayout from '@/components/ui/PageLayout.vue';
import PageSection from '@/components/ui/PageSection.vue';
import CommentsSection from '@/features/comments/CommentsSection.vue';
import { useSessionStore } from '@/stores/session.store';
import { usePermissions } from '@/stores/use-permissions';
import AddTagForm from './AddTagForm.vue';
import { mayTag, useTagProblemQuery } from './tags.queries';

/** One problem from another judge: a link to it there, its tags with who added each, adding a tag, and its comments. */
const route = useRoute();
const { t } = useI18n();
const session = useSessionStore();
const { can } = usePermissions();
const code = computed(() => String(route.params.code));
const { data, isPending, error, refetch } = useTagProblemQuery(code);
const canTag = computed(() => mayTag(session.user, can));
const back = computed(() => ({ to: { name: 'tag-problems' }, label: t('tags.title') }));
</script>

<template>
  <PageLayout>
    <template #header>
      <PageHeader
        :title="data?.name ?? code"
        :back="back"
        :meta="data ? [data.code, data.judge ?? ''].filter(Boolean) : []"
      >
        <template v-if="data" #actions>
          <AppButton :href="data.link" target="_blank" rel="noopener noreferrer">
            <template #icon><ExternalLink class="size-4" aria-hidden="true" /></template>
            {{ $t('tags.detail.open', { judge: data.judge ?? $t('tags.detail.theJudge') }) }}
          </AppButton>
        </template>
      </PageHeader>
    </template>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><SkeletonBlock class="h-32 w-full" /></template>
      <template v-if="data">
        <PageSection :title="$t('tags.detail.tags')" :count="data.assignments.length">
          <p v-if="!data.assignments.length" class="text-sm text-muted">
            {{ $t('tags.detail.noTags') }}
          </p>
          <ul v-else class="flex flex-col divide-y divide-line">
            <li
              v-for="assignment in data.assignments"
              :key="assignment.tag.id"
              class="flex min-h-(--qh-row) flex-wrap items-center gap-x-3 gap-y-1 py-2"
            >
              <Chip>{{ assignment.tag.name }}</Chip>
              <span class="text-caption text-muted">
                <template v-if="assignment.assigner">
                  {{ $t('tags.detail.addedBy') }}
                  <UserLink
                    :username="assignment.assigner.username"
                    :rating="assignment.assigner.rating"
                    size="xs"
                  />
                </template>
                <template v-else>{{ $t('tags.detail.addedByGone') }}</template>
              </span>
            </li>
          </ul>
          <AddTagForm v-if="canTag" :problem="data" class="mt-4" />
        </PageSection>
        <CommentsSection type="tagProblem" :page-key="data.code" />
      </template>
    </QueryState>
  </PageLayout>
</template>
