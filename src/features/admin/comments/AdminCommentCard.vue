<script setup lang="ts">
import type { AdminCommentItem } from '@/api/types/comments';
import GlassCard from '@/components/GlassCard.vue';
import UserName from '@/components/UserName.vue';
import { commentRoute } from '@/lib/comment-links';
import { formatDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminStatus from '../ui/AdminStatus.vue';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';

/** One comment of the moderation list: select box, where it is, who wrote it, the excerpt, and its own hide or show and edit. */
defineProps<{ item: AdminCommentItem; busy: boolean; refusal: string | null }>();
const selected = defineModel<boolean>('selected', { required: true });
defineEmits<{ setHidden: [hidden: boolean]; edit: [] }>();
const locale = useLocaleStore();
const CHIP = 'rounded-pill bg-surface-hover px-2.5 py-0.5 text-xs font-semibold';
</script>

<template>
  <GlassCard as="article" class="flex gap-3 p-4" :class="item.comment.hidden && 'opacity-80'">
    <input
      v-model="selected"
      type="checkbox"
      class="mt-1 size-5 shrink-0 accent-[var(--qh-accent)]"
      :aria-label="$t('admin.comments.all.select', { page: item.page.title })"
      :disabled="item.comment.deleted"
    />
    <div class="flex min-w-0 flex-1 flex-col gap-2">
      <header class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <RouterLink
          v-if="commentRoute(item.page, item.comment.id)"
          :to="commentRoute(item.page, item.comment.id)!"
          class="font-semibold text-accent-text hover:underline"
        >
          {{ item.page.title }}
        </RouterLink>
        <span v-else class="font-semibold">{{ item.page.title }}</span>
        <span class="text-sm text-muted">
          {{ $t(`admin.comments.all.pageTypes.${item.page.type}`) }} ·
          {{ formatDateTime(item.createdAt, locale.locale) }}
        </span>
        <span v-if="item.comment.hidden" :class="CHIP">{{
          $t('admin.comments.chips.hidden')
        }}</span>
        <span v-if="item.comment.deleted" :class="CHIP">{{
          $t('admin.comments.chips.deleted')
        }}</span>
      </header>
      <blockquote class="rounded-row bg-surface-strong px-3 py-2 text-sm">
        <UserName
          v-if="item.comment.author"
          :username="item.comment.author.username"
          :rating="item.comment.author.rating"
        />
        <span v-else class="font-semibold text-muted">{{ $t('comments.deletedAccount') }}</span>
        <p class="mt-1 break-words whitespace-pre-wrap text-muted">
          {{ item.comment.excerpt || $t('comments.deleted.placeholder') }}
        </p>
      </blockquote>
      <p v-if="item.hiddenBy" class="text-xs text-muted">
        {{ $t('admin.comments.all.hiddenBy', { name: item.hiddenBy.username }) }}
      </p>
      <div v-if="!item.comment.deleted" class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          :class="ADMIN_BUTTON_CLASS"
          :aria-disabled="busy || undefined"
          @click="busy || $emit('setHidden', !item.comment.hidden)"
        >
          {{ item.comment.hidden ? $t('admin.comments.all.show') : $t('admin.comments.all.hide') }}
        </button>
        <button type="button" :class="ADMIN_BUTTON_CLASS" @click="$emit('edit')">
          {{ $t('admin.comments.edit.action') }}
        </button>
        <AdminStatus v-if="refusal" kind="refused" :text="refusal" />
      </div>
    </div>
  </GlassCard>
</template>
