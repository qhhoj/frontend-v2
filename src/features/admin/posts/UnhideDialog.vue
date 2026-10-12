<script setup lang="ts">
import { computed } from 'vue';
import type { PostListItem } from '@/api/types/blog';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import Notice from '@/components/ui/Notice.vue';
import { formatNumericDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { unhidePlanOf } from './post-visibility';

const props = defineProps<{ post: PostListItem; busy: boolean; failure: string | null }>();
const visible = defineModel<boolean>('visible', { required: true });
defineEmits<{ confirm: [] }>();
const locale = useLocaleStore();
const plan = computed(() => unhidePlanOf(props.post, Date.now()));
const publishTime = computed(() => formatNumericDateTime(props.post.publishOn, locale.locale));
const authors = computed(() => props.post.authors.map((author) => author.username).join(', '));
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="$t('admin.posts.unhide.title')"
    :confirm-label="
      $t(plan.scheduled ? 'admin.posts.unhide.confirmScheduled' : 'admin.posts.unhide.confirm')
    "
    :busy="busy"
    @confirm="$emit('confirm')"
  >
    <div class="rounded-row bg-surface-hover px-3.5 py-3" data-testid="unhide-post">
      <strong>{{ post.title }}</strong>
      <p class="m-0 text-sm text-muted">
        {{
          $t('admin.posts.unhide.facts', {
            authors,
            time: publishTime,
            score: post.score,
            comments: post.commentCount,
          })
        }}
      </p>
    </div>
    <Notice v-if="plan.scheduled" tone="warning">
      {{ $t('admin.posts.unhide.ahead', { time: publishTime }) }}
    </Notice>
    <p v-else class="text-muted">{{ $t('admin.posts.unhide.now') }}</p>
    <template #error>
      <Notice v-if="failure" tone="danger">{{ failure }}</Notice>
    </template>
  </ConfirmDialog>
</template>
