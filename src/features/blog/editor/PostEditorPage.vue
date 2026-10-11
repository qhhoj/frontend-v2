<script setup lang="ts">
import { ArrowLeft, ChevronDown } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import StatePanel from '@/components/StatePanel.vue';
import AdminField from '@/features/admin/ui/AdminField.vue';
import { hasPermission } from '@/lib/permissions';
import { PHONE_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { usePageTitle } from '@/router/page-title';
import { useSessionStore } from '@/stores/session.store';
import { useComposeOptionsQuery } from '../blog.queries';
import PostBodyEditor from './PostBodyEditor.vue';
import PostSaveBar from './PostSaveBar.vue';
import PostSettingsCard from './PostSettingsCard.vue';
import PostStaffCard from './PostStaffCard.vue';
import { POST_LIMITS } from './post-form';
import { usePostEditor } from './use-post-editor';

/** `/blog/new` (personal, or `?organization=<slug>` preselects that organization) and `/blog/:id/edit`: board variant A. */
const route = useRoute();
const session = useSessionStore();
const isPhone = useMediaQuery(PHONE_QUERY);
const postId = computed(() => (route.name === 'post-edit' ? String(route.params.id) : null));
const options = useComposeOptionsQuery();
const organization = ref<string | null>(null);
const editor = usePostEditor(() => postId.value, organization);
const { form, rights, errors, writer } = editor;
/** The staff render (blog style) needs the problem preview permission; any other writer gets the comment preview. */
const previewStyle = computed(() =>
  hasPermission(session.user, 'judge.edit_own_problem') ? 'blog' : 'comment',
);
const isSettingsOpen = ref(false);
usePageTitle(() => editor.post.value?.title);

/** A new post starts as the `?organization=` one (kept while the options load), else personal, else the first organization. */
watch(
  [() => route.query.organization, () => options.data.value, postId],
  ([wanted, loaded, id]) => {
    if (id) return;
    const slug = typeof wanted === 'string' ? wanted : null;
    if (!loaded) organization.value = slug;
    else if (slug && loaded.organizations.some((item) => item.slug === slug))
      organization.value = slug;
    else
      organization.value = loaded.canWritePersonal ? null : (loaded.organizations[0]?.slug ?? null);
  },
  { immediate: true },
);
/** Nowhere to post: a personal post needs solved problems and no organization is open to the viewer. */
const isRefused = computed(
  () =>
    postId.value === null &&
    options.data.value !== undefined &&
    !options.data.value.canWritePersonal &&
    options.data.value.organizations.length === 0,
);
const fixedAuthor = computed(() =>
  editor.post.value ? (editor.post.value.organization?.name ?? '') : null,
);
</script>

<template>
  <div class="page-column pb-0">
    <header class="flex flex-col gap-2">
      <RouterLink
        :to="postId ? { name: 'post', params: { id: postId } } : { name: 'blog' }"
        class="inline-flex w-fit items-center gap-2 text-sm font-semibold text-accent-text hover:underline"
      >
        <ArrowLeft aria-hidden="true" class="size-4" />
        {{ postId ? $t('postEditor.backToPost') : $t('nav.blog') }}
      </RouterLink>
      <h1 class="page-title">
        {{ postId ? $t('postEditor.editTitle') : $t('postEditor.newTitle') }}
      </h1>
    </header>

    <StatePanel
      v-if="isRefused"
      kind="forbidden"
      :title="$t('postEditor.refused.title')"
      :body="$t('postEditor.refused.body', { count: options.data.value?.minSolvedProblems ?? 10 })"
    />
    <QueryState
      v-else
      :loading="postId !== null && editor.query.isPending.value"
      :error="postId ? editor.query.error.value : null"
      @retry="editor.query.refetch()"
    >
      <template #skeleton><SkeletonBlock class="h-96 w-full" /></template>
      <StatePanel
        v-if="editor.post.value && !editor.post.value.canEdit"
        kind="forbidden"
        :title="$t('admin.postEditor.cannotEdit')"
      />
      <!-- No implicit submit: only the bar's buttons save, each with its intent. -->
      <form v-else class="flex flex-col gap-6" novalidate @submit.prevent>
        <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div class="flex min-w-0 flex-col gap-5">
            <AdminField
              v-slot="{ id, describedBy, invalid }"
              :label="$t('admin.postEditor.fields.title')"
              :error="errors.title"
              input-id="post-title"
            >
              <input
                :id="id"
                v-model="form.title"
                :maxlength="POST_LIMITS.title"
                class="min-h-13 w-full rounded-row border border-line-strong bg-surface-solid px-4 font-display text-xl font-bold text-content"
                :aria-describedby="describedBy"
                :aria-invalid="invalid ? 'true' : undefined"
              />
            </AdminField>
            <PostBodyEditor
              v-model="form.content"
              :preview-style="previewStyle"
              :error="errors.content"
            />
          </div>

          <div class="flex flex-col gap-6">
            <button
              v-if="isPhone"
              type="button"
              class="flex min-h-12 items-center justify-between rounded-panel border border-line bg-surface-strong px-4 font-semibold"
              :aria-expanded="isSettingsOpen"
              aria-controls="post-settings-column"
              @click="isSettingsOpen = !isSettingsOpen"
            >
              {{ $t('postEditor.settings.toggle') }}
              <ChevronDown
                aria-hidden="true"
                class="size-4 transition-transform"
                :class="isSettingsOpen && 'rotate-180'"
              />
            </button>
            <div
              v-show="!isPhone || isSettingsOpen"
              id="post-settings-column"
              class="flex flex-col gap-6"
            >
              <PostSettingsCard
                v-model:organization="organization"
                v-model:mode="editor.mode.value"
                v-model:publish-on="form.publishOn"
                v-model:summary="form.summary"
                v-model:sticky="form.sticky"
                v-model:global-post="form.globalPost"
                :options="options.data.value"
                :fixed-author="fixedAuthor"
                :rights="rights"
                :errors="errors"
              />
              <PostStaffCard
                v-if="rights.staff"
                v-model:og-image="form.ogImage"
                v-model:authors="form.authors"
                :errors="errors"
                :is-new="postId === null"
              />
            </div>
          </div>
        </div>

        <PostSaveBar
          :mode="editor.mode.value"
          :is-live="editor.isPostLive.value"
          :is-dirty="editor.isDirty.value"
          :is-pending="writer.isPending.value"
          :is-done="writer.isDone.value"
          :is-nothing-to-save="editor.isNothingToSave.value"
          :failure="writer.failure.value"
          @save="editor.save"
        />
      </form>
    </QueryState>
  </div>
</template>
