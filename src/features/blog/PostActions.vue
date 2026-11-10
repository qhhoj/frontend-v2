<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { EllipsisVertical, Pencil, Pin, Trash2 } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { deletePost, updatePost } from '@/api/blog.api';
import type { PostDetail } from '@/api/types/blog';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import AppButton from '@/components/ui/AppButton.vue';
import IconButton from '@/components/ui/IconButton.vue';
import Menu from '@/components/ui/Menu.vue';
import type { MenuEntry } from '@/components/ui/Menu.vue';
import Notice from '@/components/ui/Notice.vue';
import { failureTextOf } from '@/features/admin/ui/admin-errors';
import { useAdminMutation } from '@/features/admin/ui/use-admin-mutation';
import { hasPermission } from '@/lib/permissions';
import { PHONE_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { useSessionStore } from '@/stores/session.store';

/** A post's own actions for its editors: edit, pin (`pin_post`) and delete (`canDelete`, confirmed); a phone folds them into a ⋮ menu. */
const props = defineProps<{ post: PostDetail }>();
const { t } = useI18n();
const router = useRouter();
const queryClient = useQueryClient();
const session = useSessionStore();
const isPhone = useMediaQuery(PHONE_QUERY);
const canPin = computed(() => props.post.canEdit && hasPermission(session.user, 'judge.pin_post'));
const isDeleteOpen = ref(false);

const remover = useAdminMutation({
  mutate: () => deletePost(props.post.id),
  invalidates: () => [['admin', 'posts']],
  onDone: () => {
    isDeleteOpen.value = false;
    // The lists only: this post's own detail query would refetch a 404 before the page leaves.
    void queryClient.invalidateQueries({ queryKey: ['posts', 'list'] });
    void queryClient.invalidateQueries({ queryKey: ['organizations', 'posts'] });
    void router.push({ name: 'blog' });
  },
});
const pinner = useAdminMutation({
  mutate: () => updatePost(props.post.id, { sticky: !props.post.sticky }),
  invalidates: () => [['admin', 'posts']],
  onDone: () => {
    void queryClient.invalidateQueries({ queryKey: ['posts'] });
    void queryClient.invalidateQueries({ queryKey: ['organizations', 'posts'] });
  },
});
const openDelete = () => {
  remover.reset();
  isDeleteOpen.value = true;
};
const toEdit = () => router.push({ name: 'post-edit', params: { id: props.post.id } });
const pinLabel = computed(() => t(props.post.sticky ? 'blogPost.unpin' : 'blogPost.pin'));

const menuItems = computed<MenuEntry[]>(() => [
  ...(props.post.canEdit ? [{ label: t('common.edit'), run: toEdit }] : []),
  ...(canPin.value ? [{ label: pinLabel.value, run: () => void pinner.run(undefined) }] : []),
  ...(props.post.canDelete ? [{ label: t('common.delete'), run: openDelete, danger: true }] : []),
]);
</script>

<template>
  <div v-if="menuItems.length" class="flex flex-wrap items-center gap-2">
    <Menu v-if="isPhone" :items="menuItems" :label="$t('blogPost.actions')">
      <template #trigger="{ toggle, open, setOpener }">
        <IconButton
          :ref="(el) => setOpener((el as { $el?: HTMLElement } | null)?.$el ?? null)"
          tone="secondary"
          :label="$t('blogPost.actions')"
          aria-haspopup="menu"
          :aria-expanded="open"
          @click="toggle"
        >
          <EllipsisVertical aria-hidden="true" class="size-4" />
        </IconButton>
      </template>
    </Menu>
    <template v-else>
      <AppButton v-if="post.canEdit" :to="{ name: 'post-edit', params: { id: post.id } }">
        <template #icon><Pencil aria-hidden="true" class="size-4" /></template>
        {{ $t('common.edit') }}
      </AppButton>
      <AppButton v-if="canPin" :loading="pinner.isPending.value" @click="pinner.run(undefined)">
        <template #icon><Pin aria-hidden="true" class="size-4" /></template>
        {{ pinLabel }}
      </AppButton>
      <AppButton v-if="post.canDelete" tone="danger" @click="openDelete">
        <template #icon><Trash2 aria-hidden="true" class="size-4" /></template>
        {{ $t('common.delete') }}
      </AppButton>
    </template>
    <Notice v-if="pinner.failure.value" tone="danger">
      {{ failureTextOf(pinner.failure.value) }}
    </Notice>
    <ConfirmDialog
      v-model:visible="isDeleteOpen"
      tone="danger"
      :title="$t('blogPost.delete.title')"
      :body="$t('blogPost.delete.body', { title: post.title })"
      :confirm-label="$t('blogPost.delete.confirm')"
      :busy="remover.isPending.value"
      @confirm="remover.run(undefined)"
    >
      <template #error>
        <Notice v-if="remover.failure.value" tone="danger">
          {{ failureTextOf(remover.failure.value) }}
        </Notice>
      </template>
    </ConfirmDialog>
  </div>
</template>
