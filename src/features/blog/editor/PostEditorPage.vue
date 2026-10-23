<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import StatePanel from '@/components/StatePanel.vue';
import FormField from '@/components/ui/FormField.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import AdminLeaveGuard from '@/features/admin/ui/form/AdminLeaveGuard.vue';
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
const { t } = useI18n();
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
const backTo = computed(() =>
  postId.value
    ? { to: { name: 'post', params: { id: postId.value } }, label: t('postEditor.backToPost') }
    : { to: { name: 'blog' }, label: t('nav.blog') },
);
/** The bar's submit publishes (or updates a live post); the draft button saves on its own. */
const publish = () => editor.save(editor.isPostLive.value ? 'keep' : 'publish');
/** Enter in a one-line field would submit the form: only the bar's buttons save. */
function blockImplicitSubmit(event: KeyboardEvent) {
  if (event.target instanceof HTMLInputElement) event.preventDefault();
}
const fixedAuthor = computed(() =>
  editor.post.value ? (editor.post.value.organization?.name ?? '') : null,
);
</script>

<template>
  <div class="page-column pb-0">
    <PageHeader
      :title="postId ? $t('postEditor.editTitle') : $t('postEditor.newTitle')"
      :crumbs="[
        { label: backTo.label, to: backTo.to },
        { label: postId ? $t('postEditor.editTitle') : $t('postEditor.newTitle') },
      ]"
      :back="backTo"
    />

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
      <form
        v-else
        class="flex flex-col gap-6"
        novalidate
        @submit.prevent="publish"
        @keydown.enter="blockImplicitSubmit"
      >
        <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div class="flex min-w-0 flex-col gap-5">
            <FormField
              v-slot="{ id, describedBy, invalid }"
              :label="$t('admin.postEditor.fields.title')"
              :error="errors.title"
              input-id="post-title"
            >
              <input
                :id="id"
                v-model="form.title"
                :maxlength="POST_LIMITS.title"
                class="min-h-13 w-full rounded-row border border-line-control bg-surface-solid px-4 font-display text-section leading-7 font-bold text-content"
                :aria-describedby="describedBy"
                :aria-invalid="invalid ? 'true' : undefined"
              />
            </FormField>
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
              class="flex min-h-12 items-center justify-between rounded-row border border-line bg-surface-strong px-4 font-semibold"
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
          @save-draft="editor.save('draft')"
        />
      </form>
    </QueryState>
    <AdminLeaveGuard :dirty-count="editor.hasUnsavedChanges.value ? 1 : 0" />
  </div>
</template>
