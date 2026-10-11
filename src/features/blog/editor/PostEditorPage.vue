<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AdminField from '@/features/admin/ui/AdminField.vue';
import AdminPageHeader from '@/features/admin/ui/AdminPageHeader.vue';
import AdminStatus from '@/features/admin/ui/AdminStatus.vue';
import MarkdownField from '@/features/admin/ui/MarkdownField.vue';
import { failureTextOf } from '@/features/admin/ui/admin-errors';
import {
  ADMIN_BUTTON_CLASS,
  ADMIN_DANGER_CLASS,
  ADMIN_INPUT_CLASS,
  ADMIN_PRIMARY_CLASS,
} from '@/features/admin/ui/classes';
import { hasPermission } from '@/lib/permissions';
import { usePageTitle } from '@/router/page-title';
import { useSessionStore } from '@/stores/session.store';
import PostPublishingCard from './PostPublishingCard.vue';
import PostStaffCard from './PostStaffCard.vue';
import { POST_LIMITS } from './post-form';
import { usePostEditor } from './use-post-editor';

/** `/blog/new` (a new personal post, or `?organization=<slug>` for that organization) and `/blog/:id/edit`. */
const route = useRoute();
const session = useSessionStore();
const postId = computed(() => (route.name === 'post-edit' ? String(route.params.id) : null));
const organization = computed(() =>
  typeof route.query.organization === 'string' ? route.query.organization : null,
);
const editor = usePostEditor(
  () => postId.value,
  () => organization.value,
);
const { form, rights, errors, writer, remover } = editor;
/** The staff render (blog style) needs the problem preview permission; any other writer gets the comment preview. */
const previewStyle = computed(() =>
  hasPermission(session.user, 'judge.edit_own_problem') ? 'blog' : 'comment',
);
const isDeleteOpen = ref(false);
usePageTitle(() => editor.post.value?.title);

/** A refused delete keeps the dialog open with the reason; a done one leaves for the blog. */
async function confirmDelete() {
  if (!postId.value) return;
  await remover.run(postId.value);
  if (remover.isDone.value) isDeleteOpen.value = false;
}
</script>

<template>
  <div class="page-column flex flex-col gap-6">
    <AdminPageHeader
      :crumbs="[
        { label: $t('nav.blog'), to: { name: 'blog' } },
        ...(postId && editor.post.value
          ? [{ label: editor.post.value.title, to: { name: 'post', params: { id: postId } } }]
          : []),
      ]"
      :title="postId ? $t('admin.postEditor.editTitle') : $t('admin.postEditor.newTitle')"
      :lead="
        organization ? $t('admin.postEditor.forOrganization', { slug: organization }) : undefined
      "
    >
      <template #actions>
        <RouterLink
          v-if="postId"
          :to="{ name: 'post', params: { id: postId } }"
          :class="ADMIN_BUTTON_CLASS"
        >
          {{ $t('admin.postEditor.view') }}
        </RouterLink>
        <button
          v-if="editor.post.value?.canDelete"
          type="button"
          :class="ADMIN_DANGER_CLASS"
          @click="isDeleteOpen = true"
        >
          {{ $t('admin.postEditor.delete.action') }}
        </button>
      </template>
    </AdminPageHeader>

    <QueryState
      :loading="postId !== null && editor.query.isPending.value"
      :error="postId ? editor.query.error.value : null"
      @retry="editor.query.refetch()"
    >
      <template #skeleton><SkeletonBlock class="h-96 w-full" /></template>
      <AdminStatus
        v-if="editor.post.value && !editor.post.value.canEdit"
        kind="refused"
        :text="$t('admin.postEditor.cannotEdit')"
      />
      <form v-else class="flex flex-col gap-6" novalidate @submit.prevent="editor.save()">
        <section
          class="flex flex-col gap-5 rounded-panel border border-line bg-surface-solid p-4 sm:p-5"
          :aria-label="$t('admin.postEditor.content')"
        >
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
              :class="ADMIN_INPUT_CLASS"
              :aria-describedby="describedBy"
              :aria-invalid="invalid ? 'true' : undefined"
            />
          </AdminField>
          <MarkdownField
            v-model="form.content"
            :label="$t('admin.postEditor.fields.content')"
            :preview-style="previewStyle"
            :error="errors.content"
          />
        </section>

        <div class="grid gap-6 lg:grid-cols-2">
          <PostPublishingCard
            v-model:visible="form.visible"
            v-model:publish-on="form.publishOn"
            :errors="errors"
          />
          <PostStaffCard
            v-if="rights.staff || rights.pin || rights.markGlobal"
            v-model:sticky="form.sticky"
            v-model:global-post="form.globalPost"
            v-model:summary="form.summary"
            v-model:og-image="form.ogImage"
            v-model:authors="form.authors"
            :errors="errors"
            :rights="rights"
            :is-new="postId === null"
          />
        </div>

        <div
          class="sticky bottom-0 z-10 flex flex-wrap items-center gap-3 rounded-panel border border-line bg-surface-solid p-3 shadow-lg"
        >
          <button
            type="submit"
            :class="ADMIN_PRIMARY_CLASS"
            :aria-disabled="writer.isPending.value || undefined"
          >
            {{
              writer.isPending.value
                ? $t('admin.postEditor.saving')
                : postId
                  ? $t('admin.postEditor.save')
                  : $t('admin.postEditor.create')
            }}
          </button>
          <AdminStatus
            v-if="writer.isDone.value"
            kind="done"
            :text="$t('admin.postEditor.saved')"
          />
          <AdminStatus
            v-else-if="editor.isNothingToSave.value"
            kind="queued"
            :text="$t('admin.postEditor.nothingToSave')"
          />
          <AdminStatus
            v-else-if="writer.failure.value"
            kind="refused"
            :text="failureTextOf(writer.failure.value)"
          />
        </div>
      </form>
    </QueryState>

    <ConfirmDialog
      v-model:visible="isDeleteOpen"
      tone="danger"
      :title="$t('admin.postEditor.delete.title', { title: editor.post.value?.title ?? '' })"
      :body="$t('admin.postEditor.delete.body')"
      :confirm-label="$t('admin.postEditor.delete.confirm')"
      :busy="remover.isPending.value"
      @confirm="confirmDelete"
    >
      <template #error>
        <AdminStatus
          v-if="remover.failure.value"
          kind="refused"
          :text="failureTextOf(remover.failure.value)"
        />
      </template>
    </ConfirmDialog>
  </div>
</template>
